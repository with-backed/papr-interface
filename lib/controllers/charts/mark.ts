import { Price, Token } from '@uniswap/sdk-core';
import { getAddress } from 'ethers/lib/utils';
import { Q192, SECONDS_IN_A_DAY } from 'lib/constants';
import { PaprController, SubgraphController } from 'lib/PaprController';
import { subgraphUniswapSwapsByPool } from 'lib/uniswapSubgraph';
import { UTCTimestamp } from 'lightweight-charts';
import {
  Pool,
  Token as UniSubgraphToken,
} from 'types/generated/graphql/uniswapSubgraph';

import { RatePeriod } from '..';
import { TimeSeriesValue } from '.';

export async function markValues(
  now: number,
  controller: PaprController | SubgraphController,
  pool: Pool,
  uniswapSubgraphUrl: string,
): Promise<[TimeSeriesValue[], TimeSeriesValue[]]> {
  let quoteCurrency: UniSubgraphToken;
  let baseCurrency: UniSubgraphToken;
  if (getAddress(controller.underlying.id) == getAddress(pool.token0.id)) {
    quoteCurrency = pool.token0;
    baseCurrency = pool.token1;
  } else {
    quoteCurrency = pool.token1;
    baseCurrency = pool.token0;
  }

  const swapsQuery = await subgraphUniswapSwapsByPool(
    controller.poolAddress,
    uniswapSubgraphUrl,
  );
  const sortedSwaps =
    swapsQuery?.swaps.sort(
      (a: any, b: any) => parseInt(a.timestamp) - parseInt(b.timestamp),
    ) || [];

  // add an artifial data point at the current timestamp
  // could also use the uniswap Pool object and fetch price
  // TODO consider fetching mark from contract? But need to convert back to sqrtPriceX96
  // TODO: had to cast this dummy value to satisfy new type, should figure out a better way
  if (sortedSwaps.length > 0) {
    sortedSwaps.push({
      sqrtPriceX96: sortedSwaps[sortedSwaps.length - 1].sqrtPriceX96,
      timestamp: now,
    } as any);
  }

  const formattedSwapValues = sortedSwaps.map(({ sqrtPriceX96, timestamp }) => {
    return {
      value: parseFloat(
        price(sqrtPriceX96, baseCurrency, quoteCurrency, pool.token0).toFixed(),
      ),
      time: parseInt(timestamp) as UTCTimestamp,
    };
  });

  const dprValues = computeMarkPercentageRates(
    formattedSwapValues,
    RatePeriod.Daily,
    controller.createdAt,
    baseCurrency,
    quoteCurrency,
  );
  return [formattedSwapValues, dprValues];
}

export function computeMarkPercentageRates(
  swaps: TimeSeriesValue[],
  period: RatePeriod,
  startTime: number,
  baseCurrency: UniSubgraphToken,
  quoteCurrency: UniSubgraphToken,
): TimeSeriesValue[] {
  const periodSecods =
    period == RatePeriod.Daily ? SECONDS_IN_A_DAY : SECONDS_IN_A_DAY * 365;

  return swaps.map(({ value, time }) => {
    const rate = ((value - 1) / (time - startTime)) * periodSecods;

    return {
      value: rate,
      time,
    };
  });
}

function price(
  sqrtPriceX96: number,
  baseCurrency: UniSubgraphToken,
  quoteCurrency: UniSubgraphToken,
  token0: UniSubgraphToken,
): Price<Token, Token> {
  return new Price(
    subgraphTokenToToken(baseCurrency),
    subgraphTokenToToken(quoteCurrency),
    token0.id !== quoteCurrency.id
      ? Q192.toString()
      : BigNumber.from(sqrtPriceX96).mul(sqrtPriceX96).toString(),
    token0.id === quoteCurrency.id
      ? Q192.toString()
      : BigNumber.from(sqrtPriceX96).mul(sqrtPriceX96).toString(),
  );
}

function subgraphTokenToToken(token: UniSubgraphToken): Token {
  return new Token(
    1,
    token.id,
    parseInt(token.decimals),
    token.symbol,
    token.name,
  );
}
