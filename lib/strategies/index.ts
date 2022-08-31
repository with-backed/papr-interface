import { Pool } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import { Config, SupportedNetwork } from 'lib/config';
import { SECONDS_IN_A_DAY, SECONDS_IN_A_YEAR } from 'lib/constants';
import { makeProvider } from 'lib/contracts';
import {
  ERC20,
  ERC20__factory,
  ERC721,
  ERC721__factory,
  IUniswapV3Pool,
  IUniswapV3Pool__factory,
  Strategy,
  Strategy__factory,
} from 'types/generated/abis';
import { Chain } from 'wagmi';
import { ONE } from './constants';
import { getPool } from './uniswap';
import { lambertW0 } from 'lambert-w-function';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export type LendingStrategy = {
  name: string;
  symbol: string;
  contract: Strategy;
  pool: Pool;
  token0IsUnderlying: boolean;
  token0: ERC20Token;
  token1: ERC20Token;
  underlying: ERC20Token;
  collateral: ERC721Token;
  debtVault: ERC721;
  maxLTV: ethers.BigNumber;
  targetAnnualGrowth: ethers.BigNumber;
  currentAPRBIPs: ethers.BigNumber;
};

export type ERC20Token = {
  contract: ERC20;
  decimals: number;
  name: string;
  symbol: string;
};

export type ERC721Token = {
  contract: ERC721;
  name: string;
  symbol: string;
};

export async function populateLendingStrategy(
  address: string,
  config: Config,
  signer?: ethers.Signer,
): Promise<LendingStrategy> {
  const provider = makeProvider(
    config.jsonRpcProvider,
    config.network as SupportedNetwork,
  );
  const contract = Strategy__factory.connect(address, signer || provider);
  const poolAddress = await contract.pool();
  const poolContract = IUniswapV3Pool__factory.connect(poolAddress, provider);

  const token0Address = await poolContract.token0();
  const token1Address = await poolContract.token1();
  const token0 = await buildToken(
    ERC20__factory.connect(token0Address, provider),
  );
  const token1 = await buildToken(
    ERC20__factory.connect(token1Address, provider),
  );
  const underlyingAddress = await contract.underlying();
  const underlying = underlyingAddress == token0Address ? token0 : token1;

  const pool = await getPool(poolContract, token0, token1, config.chainId);

  /// TODO eventually we should index the strategies assets it lends to
  /// and have an array of assets here
  const collateralAddress = process.env.NEXT_PUBLIC_MOCK_APE as string;
  const collateral = ERC721__factory.connect(collateralAddress, provider);

  const debtVaultAddress = await contract.debtVault();
  const debtVault = ERC721__factory.connect(debtVaultAddress, provider);

  /// TODO expose period from contract so we can not just assume period is 28 days.
  const targetAnnualGrowth = (await contract.targetGrowthPerPeriod())
    .mul(12)
    .div(ONE.div(10000));
  const lastUpdated = await contract.lastUpdated();
  const now = ethers.BigNumber.from(Date.now()).div(1000);
  const currentAPRBIPs = await computeEffectiveAPR(
    now,
    lastUpdated,
    await contract.multiplier(),
  );

  return {
    name: await contract.name(),
    symbol: await contract.symbol(),
    contract: contract,
    pool: pool,
    token0: token0,
    token1: token1,
    collateral: {
      contract: collateral,
      name: await collateral.name(),
      symbol: await collateral.symbol(),
    },
    underlying,
    debtVault: debtVault,
    maxLTV: await contract.maxLTV(),
    targetAnnualGrowth: targetAnnualGrowth,
    token0IsUnderlying: token0.contract.address == underlying.contract.address,
    currentAPRBIPs: currentAPRBIPs,
  };
}

export async function buildToken(token: ERC20): Promise<ERC20Token> {
  return {
    contract: token,
    decimals: await token.decimals(),
    symbol: await token.symbol(),
    name: await token.name(),
  };
}

export async function computeEffectiveAPR(
  now: ethers.BigNumber,
  lastUpdated: ethers.BigNumber,
  multiplier: ethers.BigNumber,
) {
  const currentAPRBIPs = multiplier
    .sub(ONE) // only care about decimals
    .div(now.sub(lastUpdated)) // how much growth per second
    .mul(SECONDS_IN_A_YEAR) // annualize
    .div(ONE.div(10000)); // convert to BIPs

  return currentAPRBIPs;
}

// TODO(adamgobes): figure out how to do powWad locally in JS
export async function multiplier(
  strategy: LendingStrategy,
  now: ethers.BigNumber,
  mark: ethers.BigNumber,
) {
  const lastUpdated = await strategy.contract.lastUpdated();
  const PERIOD = ethers.BigNumber.from(28 * SECONDS_IN_A_DAY);
  const targetGrowthPerPeriod = await strategy.contract.targetGrowthPerPeriod();
  const index = await strategy.contract.index();

  const period = now.sub(lastUpdated);
  const periodRatio = period.mul(ONE).div(PERIOD);
  const targetGrowth = targetGrowthPerPeriod.mul(periodRatio).div(ONE).add(ONE);
  let indexMarkRatio = index.mul(ONE).div(mark);

  if (indexMarkRatio.gt(14e17)) {
    indexMarkRatio = ethers.BigNumber.from(14e17);
  } else {
    indexMarkRatio = ethers.BigNumber.from(8e17);
  }

  const deviationMultiplier = indexMarkRatio.pow(periodRatio);

  return deviationMultiplier.mul(targetGrowth).div(ONE);
}

export async function computeLiquidationEstimation(
  debt: ethers.BigNumber,
  max: ethers.BigNumber,
  strategy: LendingStrategy,
) {
  const debtTaken = debt.toNumber();
  const maxDebt = max.toNumber();

  const percentage = (debtTaken / maxDebt) * 100;

  const desiredMultiplier = 100 / percentage;

  const PERIOD = 28 * SECONDS_IN_A_DAY;

  const targetGrowthPerPeriod =
    (await strategy.contract.targetGrowthPerPeriod())
      .div(ONE.div(10000))
      .toNumber() * 0.0001;

  const indexMarkRatio = 1.4;

  const productLogInside =
    (Math.pow(indexMarkRatio, 1 / targetGrowthPerPeriod) *
      desiredMultiplier *
      Math.log(indexMarkRatio)) /
    targetGrowthPerPeriod;

  const periodRatio =
    lambertW0(productLogInside) / Math.log(indexMarkRatio) -
    1 / targetGrowthPerPeriod;

  const period = PERIOD * periodRatio;

  const result = dayjs.duration({ seconds: period });

  return result.asDays();
}
