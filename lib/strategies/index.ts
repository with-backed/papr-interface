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
  IQuoter,
  IUniswapV3Pool,
  IUniswapV3Pool__factory,
  Strategy,
  Strategy__factory,
} from 'types/generated/abis';
import { ONE, PRICE } from './constants';
import { getPool } from './uniswap';
import { lambertW0 } from 'lambert-w-function';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { ChartValue } from 'lib/d3';
import { Price } from '@uniswap/sdk-core';

dayjs.extend(duration);

// TODO this is mostly redudant to the graph info,
// probably just use the graph is possible
export type LendingStrategy = {
  contract: Strategy;
  pool: Pool;
  token0IsUnderlying: boolean;
  token0: ERC20Token;
  token1: ERC20Token;
  underlying: ERC20Token;
  collateral: ERC721Token;
  maxLTVPercent: number;
  targetAnnualGrowthPercent: number;
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
  signerOrProvider?: ethers.Signer | ethers.providers.Provider,
): Promise<LendingStrategy> {
  const provider = makeProvider(
    config.jsonRpcProvider,
    config.network as SupportedNetwork,
  );
  const contract = Strategy__factory.connect(
    address,
    signerOrProvider || provider,
  );
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

  const targetGrowthPerPeriod = await contract.targetGrowthPerPeriod();
  /// TODO expose period from contract so we can not just assume period is 28 days.
  // 365/28 = 13.035
  const targetAnnualGrowth = targetGrowthPerPeriod.mul(13).div(ONE.div(10000));
  const lastUpdated = await contract.lastUpdated();
  const now = ethers.BigNumber.from(Date.now()).div(1000);
  const currentAPRBIPs = await computeEffectiveAPR(
    now,
    lastUpdated,
    await contract.multiplier(),
  );

  return {
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
    maxLTVPercent: convertONEScaledPercent(await contract.maxLTV(), 2),
    targetAnnualGrowthPercent: convertONEScaledPercent(targetAnnualGrowth, 2),
    token0IsUnderlying: token0.contract.address == underlying.contract.address,
  };
}

export function convertONEScaledPercent(
  n: ethers.BigNumber,
  decimals: number,
): number {
  return convertOneScaledValue(n, decimals + 2) * 100;
}

export function convertOneScaledValue(
  n: ethers.BigNumber,
  decimals: number,
): number {
  return n.div(ONE.div(10 ** decimals)).toNumber() / 10 ** decimals;
}

export async function buildToken(token: ERC20): Promise<ERC20Token> {
  return {
    contract: token,
    decimals: await token.decimals(),
    symbol: await token.symbol(),
    name: await token.name(),
  };
}

export function computeEffectiveAPR(
  now: ethers.BigNumber,
  lastUpdated: ethers.BigNumber,
  multiplier: ethers.BigNumber,
) {
  const delta = now.sub(lastUpdated);
  const currentAPRBIPs = multiplier
    .sub(ONE) // only care about decimals
    .div(delta.eq(0) ? 1 : delta) // how much growth per second
    .mul(SECONDS_IN_A_YEAR) // annualize
    .div(ONE.div(10000)); // convert to BIPs

  return currentAPRBIPs;
}

export function computeEffectiveDPR(
  now: ethers.BigNumber,
  lastUpdated: ethers.BigNumber,
  multiplier: ethers.BigNumber,
  decimals = 4,
) {
  const delta = now.sub(lastUpdated);
  const dpr = multiplier
    .sub(ONE) // only care about decimals
    .div(delta.eq(0) ? 1 : delta) // how much growth per second
    .mul(SECONDS_IN_A_DAY); // compute for one day

  return convertONEScaledPercent(dpr, decimals);
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

export async function getQuoteForSwap(
  quoter: IQuoter,
  amount: ethers.BigNumber,
  tokenIn: ERC20Token,
  tokenOut: ERC20Token,
) {
  const q = await quoter.callStatic.quoteExactInputSingle(
    tokenIn.contract.address,
    tokenOut.contract.address,
    ethers.BigNumber.from(10).pow(4), // TODO(adamgobes): don't hardcode this
    amount,
    0,
  );
  return q;
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

export async function computeSlippageForSwap(
  quoteWithSlippage: ethers.BigNumber,
  tokenIn: ERC20Token,
  tokenOut: ERC20Token,
  amount: ethers.BigNumber,
  quoter: IQuoter,
) {
  const quoteWithoutSlippage = await quoter.callStatic.quoteExactInputSingle(
    tokenIn.contract.address,
    tokenOut.contract.address,
    ethers.BigNumber.from(10).pow(4),
    ethers.utils.parseUnits('1', tokenIn.decimals),
    0,
  );

  const quoteWithSlippageFloat = parseFloat(
    ethers.utils.formatUnits(
      quoteWithSlippage,
      ethers.BigNumber.from(tokenOut.decimals),
    ),
  );
  const quoteWithoutSlippageFloat = parseFloat(
    ethers.utils.formatUnits(
      quoteWithoutSlippage,
      ethers.BigNumber.from(tokenOut.decimals),
    ),
  );

  // since quoteWithoutSlippage was 1 unit, scale it up to what it would have been had we tried to quote amount
  const quoteWithoutSlippageScaled =
    quoteWithoutSlippageFloat *
    parseFloat(
      ethers.utils.formatUnits(amount, ethers.BigNumber.from(tokenIn.decimals)),
    );

  const priceImpact =
    (quoteWithoutSlippageScaled - quoteWithSlippageFloat) /
    ((quoteWithoutSlippageScaled + quoteWithSlippageFloat) / 2);

  return priceImpact * 100;
}

export function getDebtTokenMarketPrice(strategy: LendingStrategy) {
  if (strategy == null) {
    return null;
  }
  return strategy.token0IsUnderlying
    ? strategy.pool.token1Price
    : strategy.pool.token0Price;
}

export async function getDebtTokenStrategyPrice(strategy: LendingStrategy) {
  return await strategy.contract.newNorm();
}

export async function getOracleValueForStrategy(strategy: LendingStrategy) {
  return PRICE;
}
