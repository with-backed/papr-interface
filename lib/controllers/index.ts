import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { PaprController } from 'hooks/useController';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { lambertW0 } from 'lambert-w-function';
import { configs, SupportedToken } from 'lib/config';
import { SECONDS_IN_A_DAY, SECONDS_IN_A_YEAR } from 'lib/constants';
import { makeProvider, Quoter } from 'lib/contracts';
import { getCurrentUnixTime } from 'lib/duration';
import { formatBigNum } from 'lib/numberFormat';
import { OraclePriceType, ReservoirResponseData } from 'lib/oracle/reservoir';
import { SubgraphController } from 'lib/PaprController';
import { percentChange } from 'lib/tokenPerformance';
import { ERC20, ERC721, PaprController__factory } from 'types/generated/abis';

import { ONE } from './constants';

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

export enum RatePeriod {
  Daily,
  Annual,
}

export function computeRate(
  value1: ethers.BigNumber,
  value2: ethers.BigNumber,
  time1: number,
  time2: number,
  ratePeriod: RatePeriod,
): number {
  const timeDelta = time2 - time1;
  const percentageChange = value2.sub(value1).mul(ONE).div(value1);
  const percentageChangePerSecond = percentageChange.div(
    timeDelta == 0 ? 1 : timeDelta,
  );
  return (
    percentageChangePerSecond
      .mul(secondsForRatePeriod(ratePeriod))
      .div(ONE.div(10000)) // four deciamls
      .toNumber() / 10000
  );
}

// Compute the funding rate implied by the
// current multiplier from the contract
export function rateFromMultiplier(
  now: number,
  lastUpdated: number,
  multiplier: ethers.BigNumber,
  ratePeriod: RatePeriod,
) {
  const delta = now - lastUpdated;
  return multiplier
    .sub(ONE) // only care about decimals
    .div(delta == 0 ? 1 : delta) // how much growth per second
    .mul(secondsForRatePeriod(ratePeriod)) // annualize
    .div(ONE.div(10000)); // convert to BIPs
}

export function secondsForRatePeriod(period: RatePeriod): number {
  switch (period) {
    case RatePeriod.Daily:
      return SECONDS_IN_A_DAY;
    case RatePeriod.Annual:
      return SECONDS_IN_A_DAY * 365;
  }
}

export async function getQuoteForSwap(
  amount: ethers.BigNumber,
  tokenIn: string,
  tokenOut: string,
  tokenName: SupportedToken,
) {
  const quoter = Quoter(configs[tokenName].jsonRpcProvider, tokenName);
  const q = await quoter.callStatic.quoteExactInputSingle(
    tokenIn,
    tokenOut,
    ethers.BigNumber.from(10).pow(4), // TODO(adamgobes): don't hardcode this
    amount,
    0,
  );
  return q;
}

export async function getQuoteForSwapOutput(
  amount: ethers.BigNumber,
  tokenIn: string,
  tokenOut: string,
  tokenName: SupportedToken,
) {
  const quoter = Quoter(configs[tokenName].jsonRpcProvider, tokenName);
  const q = await quoter.callStatic.quoteExactOutputSingle(
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
  controller: SubgraphController,
) {
  const debtTaken = parseFloat(
    ethers.utils.formatUnits(debt, controller.paprToken.decimals),
  );
  const maxDebt = parseFloat(
    ethers.utils.formatUnits(max, controller.paprToken.decimals),
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
  useExactInput: boolean,
  tokenName: SupportedToken,
) {
  const quoter = Quoter(configs[tokenName].jsonRpcProvider, tokenName);
  let quoteWithoutSlippage: ethers.BigNumber;
  if (useExactInput) {
    quoteWithoutSlippage = await quoter.callStatic.quoteExactInputSingle(
      tokenIn.id,
      tokenOut.id,
      ethers.BigNumber.from(10).pow(4),
      ethers.utils.parseUnits('1', tokenIn.decimals),
      0,
    );
  } else {
    quoteWithoutSlippage = await quoter.callStatic.quoteExactOutputSingle(
      tokenIn.id,
      tokenOut.id,
      ethers.BigNumber.from(10).pow(4),
      ethers.utils.parseUnits('1', tokenOut.decimals),
      0,
    );
  }

  const quoteWithSlippageFloat = parseFloat(
    ethers.utils.formatUnits(
      quoteWithSlippage,
      ethers.BigNumber.from(
        useExactInput ? tokenOut.decimals : tokenIn.decimals,
      ),
    ),
  );
  const quoteWithoutSlippageFloat = parseFloat(
    ethers.utils.formatUnits(
      quoteWithoutSlippage,
      ethers.BigNumber.from(
        useExactInput ? tokenOut.decimals : tokenIn.decimals,
      ),
    ),
  );

  // since quoteWithoutSlippage was 1 unit, scale it up to what it would have been had we tried to quote amount
  const quoteWithoutSlippageScaled =
    quoteWithoutSlippageFloat *
    parseFloat(
      ethers.utils.formatUnits(
        amount,
        ethers.BigNumber.from(
          useExactInput ? tokenIn.decimals : tokenOut.decimals,
        ),
      ),
    );

  const priceImpact =
    Math.abs(quoteWithoutSlippageScaled - quoteWithSlippageFloat) /
    ((quoteWithoutSlippageScaled + quoteWithSlippageFloat) / 2);

  return priceImpact * 100;
}

export const getUniqueNFTId = (address: string, tokenId: string): string =>
  `${getAddress(address)}-${tokenId}`;

export const deconstructFromId = (id: string): [string, string] => {
  const indexOfDash = id.indexOf('-');
  const address = id.substring(0, indexOfDash);
  const tokenId = id.substring(indexOfDash + 1);
  return [address, tokenId];
};

export function computeLtv(
  debt: ethers.BigNumberish,
  totalCollateralValue: ethers.BigNumberish,
  norm: ethers.BigNumberish,
) {
  const valueNormRatio = ethers.BigNumber.from(totalCollateralValue).div(norm);
  if (valueNormRatio.isZero()) return ethers.BigNumber.from(0);

  return ethers.BigNumber.from(debt).div(valueNormRatio);
}

export function oracleInfoProxy<T>(obj: { [key: string]: T }) {
  const proxy = new Proxy(obj, {
    get(target, prop) {
      try {
        return target[getAddress(prop as string)];
      } catch (e) {
        return undefined;
      }
    },
  });

  return proxy;
}

export async function getOracleInfoFromAllowedCollateral(
  collections: string[],
  token: SupportedToken,
  kind: OraclePriceType = OraclePriceType.lower,
): Promise<OracleInfo> {
  const oracleInfoFromAPI: ReservoirResponseData[] = await Promise.all(
    collections.map(async (collectionAddress) => {
      const req = await fetch(
        `/api/tokens/${token}/oracle/collections/${collectionAddress}?kind=${kind}`,
        {
          method: 'POST',
        },
      );
      return req.json();
    }),
  );
  const oracleInfo = collections.reduce(
    (prev, current, i) => ({
      ...prev,
      [getAddress(current)]: oracleInfoFromAPI[i] as ReservoirResponseData,
    }),
    {} as OracleInfo,
  );

  return oracleInfoProxy(oracleInfo);
}

export function computeLTVFromDebts(
  debt: ethers.BigNumber,
  maxDebt: ethers.BigNumber,
  maxLTV: ethers.BigNumberish,
  debtTokenDecimals: number,
): number {
  if (maxDebt.isZero()) return 0;
  const maxNumber = parseFloat(formatBigNum(maxDebt, debtTokenDecimals));
  const debtNumber = parseFloat(formatBigNum(debt, debtTokenDecimals));
  return (
    (debtNumber / maxNumber) * parseFloat(ethers.utils.formatEther(maxLTV))
  );
}

export function controllerNFTValue(
  controller: PaprController,
  oracleInfo: OracleInfo | undefined,
) {
  if (!controller.vaults || controller.vaults.length === 0 || !oracleInfo) {
    return 0;
  }
  const collateral = controller.vaults.map((v) => ({
    id: v.token.id,
    count: v.collateralCount,
  }));
  const value = collateral.reduce(
    (acc, { id, count }) => acc + oracleInfo[id].price * count,
    0,
  );
  return value;
}

export async function computeNewProjectedRate(
  newMark: number,
  target: number,
  secondsHeld: number,
  token: SupportedToken,
): Promise<number> {
  const rpcProvider = makeProvider(configs[token].jsonRpcProvider, token);
  const controller = PaprController__factory.connect(
    configs[token].controllerAddress,
    rpcProvider,
  );

  const targetMarkRatioMax = parseFloat(
    ethers.utils.formatEther(await controller.targetMarkRatioMax()),
  );
  const targetMarkRatioMin = parseFloat(
    ethers.utils.formatEther(await controller.targetMarkRatioMin()),
  );
  const fundingPeriod = (await controller.fundingPeriod()).toNumber();

  const tenMinutesFromNow = getCurrentUnixTime().add(secondsHeld).toNumber();
  const period = tenMinutesFromNow - getCurrentUnixTime().toNumber();

  const periodRatio = period / fundingPeriod;
  let targetMarkRatio: number;
  if (newMark === 0) {
    targetMarkRatio = targetMarkRatioMax;
  } else {
    targetMarkRatio = target / newMark;
    if (targetMarkRatio > targetMarkRatioMax) {
      targetMarkRatio = targetMarkRatioMax;
    } else if (targetMarkRatio < targetMarkRatioMin) {
      targetMarkRatio = targetMarkRatioMin;
    }
  }
  const m = Math.pow(targetMarkRatio, periodRatio);

  const newTarget = target * m;
  const change = percentChange(target, newTarget);
  const apr = (change / secondsHeld) * SECONDS_IN_A_YEAR;
  return apr;
}
