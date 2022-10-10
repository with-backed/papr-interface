import { ethers } from 'ethers';
import { SECONDS_IN_A_DAY, SECONDS_IN_A_YEAR } from 'lib/constants';
import { ERC20, ERC721, IQuoter } from 'types/generated/abis';
import { ONE, PRICE } from './constants';
import { lambertW0 } from 'lambert-w-function';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { getAddress } from 'ethers/lib/utils';
import { LendingStrategy } from 'lib/LendingStrategy';

dayjs.extend(duration);

export interface ERC20Token {
  id: string;
  decimals: number;
  name: string;
  symbol: string;
}

export type ERC721Token = {
  contract: ERC721;
  name: string;
  symbol: string;
};

export function convertOneScaledValue(
  n: ethers.BigNumber,
  decimals: number,
): number {
  return n.div(ONE.div(10 ** decimals)).toNumber() / 10 ** decimals;
}

export async function buildToken(token: ERC20): Promise<ERC20Token> {
  return {
    id: token.address,
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

  return convertOneScaledValue(dpr, decimals);
}

// TODO(adamgobes): figure out how to do powWad locally in JS
export async function multiplier(
  strategy: LendingStrategy,
  now: ethers.BigNumber,
  mark: ethers.BigNumber,
) {
  const lastUpdated = await strategy.lastUpdated();
  const PERIOD = ethers.BigNumber.from(28 * SECONDS_IN_A_DAY);
  const index = await strategy.index();

  const period = now.sub(lastUpdated);
  const periodRatio = period.mul(ONE).div(PERIOD);
  let indexMarkRatio = ONE.div(mark);

  /// TODO fetch actual indexMark min and max from contract
  if (indexMarkRatio.gt(14e17)) {
    indexMarkRatio = ethers.BigNumber.from(14e17);
  } else {
    indexMarkRatio = ethers.BigNumber.from(8e17);
  }

  return indexMarkRatio.pow(periodRatio);
}

export async function getQuoteForSwap(
  quoter: IQuoter,
  amount: ethers.BigNumber,
  tokenIn: string,
  tokenOut: string,
) {
  const q = await quoter.callStatic.quoteExactInputSingle(
    tokenIn,
    tokenOut,
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
  const debtTaken = parseFloat(
    ethers.utils.formatUnits(debt, strategy.debtToken.decimals),
  );
  const maxDebt = parseFloat(
    ethers.utils.formatUnits(max, strategy.debtToken.decimals),
  );

  const percentage = (debtTaken / maxDebt) * 100;

  const desiredMultiplier = 100 / percentage;

  const PERIOD = 28 * SECONDS_IN_A_DAY;

  /// TODO recheck formula with no target growth
  const targetGrowthPerPeriod = 1;

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
    tokenIn.id,
    tokenOut.id,
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

export async function getDebtTokenMarketPrice(strategy: LendingStrategy) {
  if (strategy == null) {
    return null;
  }
  const pool = await strategy.pool();
  return strategy.token0IsUnderlying ? pool.token1Price : pool.token0Price;
}

export async function getDebtTokenStrategyPrice(strategy: LendingStrategy) {
  return await strategy.newNorm();
}

export async function getOracleValueForStrategy(strategy: LendingStrategy) {
  return PRICE;
}

export const getUniqueNFTId = (address: string, tokenId: string): string =>
  `${getAddress(address)}-${tokenId}`;

export const deconstructFromId = (id: string): [string, string] => {
  const indexOfDash = id.indexOf('-');
  const address = id.substring(0, indexOfDash);
  const tokenId = id.substring(indexOfDash + 1);
  return [address, tokenId];
};
