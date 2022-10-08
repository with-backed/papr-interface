import { Price, Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { Q192, SECONDS_IN_A_DAY } from 'lib/constants';
import { ChartValue } from '../charts';
import { LendingStrategy, SubgraphStrategy } from 'lib/LendingStrategy';
import { subgraphUniswapSwapsByPool } from 'lib/uniswapSubgraph';
import {
  Pool,
  Token as UniSubgraphToken,
} from 'types/generated/graphql/uniswapSubgraph';

export async function markValues(
  now: number,
  strategy: LendingStrategy | SubgraphStrategy,
  pool: Pool,
  uniswapSubgraphUrl: string,
): Promise<[ChartValue[], ChartValue[]]> {
  let quoteCurrency: UniSubgraphToken;
  let baseCurrency: UniSubgraphToken;
  if (strategy.underlying == pool.token0) {
    quoteCurrency = pool.token1;
    baseCurrency = pool.token0;
  } else {
    quoteCurrency = pool.token0;
    baseCurrency = pool.token1;
  }

  const swapsQuery = await subgraphUniswapSwapsByPool(
    strategy.poolAddress,
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

  let dprValues: ChartValue[] = [];
  let formattedSwapValues: ChartValue[] = [];
  for (let { sqrtPriceX96, timestamp } of sortedSwaps) {
    const scaledMarkDPR = price(sqrtPriceX96, baseCurrency, quoteCurrency)
      .subtract(1)
      .divide(timestamp - strategy.createdAt)
      .multiply(SECONDS_IN_A_DAY);

    const t = parseInt(timestamp);
    dprValues.push([parseFloat(scaledMarkDPR.toFixed(8)), t]);
    formattedSwapValues.push([
      parseFloat(price(sqrtPriceX96, baseCurrency, quoteCurrency).toFixed()),
      t,
    ]);
  }

  return [formattedSwapValues, dprValues];
}

function price(
  sqrtPriceX96: string,
  baseCurrency: UniSubgraphToken,
  quoteCurrency: UniSubgraphToken,
): Price<Token, Token> {
  return new Price(
    subgraphTokenToToken(baseCurrency),
    subgraphTokenToToken(quoteCurrency),
    Q192.toString(),
    ethers.BigNumber.from(sqrtPriceX96).mul(sqrtPriceX96).toString(),
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
