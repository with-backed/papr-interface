import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { ONE, Q192, SECONDS_IN_A_DAY } from 'lib/constants';
import { ChartValue } from 'lib/d3';
import { subgraphUniswapSwapsByPool } from 'lib/uniswapSubgraph';
import { LendingStrategy } from 'types/generated/graphql/inKindSubgraph';
import {
  Pool,
  Token as UniSubgraphToken,
} from 'types/generated/graphql/uniswapSubgraph';
import { convertONEScaledPercent } from '..';

export async function markValues(
  now: number,
  strategy: LendingStrategy,
  pool: Pool,
): Promise<ChartValue[]> {
  let quoteCurrency;
  let baseCurrency;
  if (strategy.underlying == pool.token0) {
    quoteCurrency = pool.token1;
    baseCurrency = pool.token0;
  } else {
    quoteCurrency = pool.token0;
    baseCurrency = pool.token1;
  }

  const swapsQuery = await subgraphUniswapSwapsByPool(strategy.poolAddress);
  const sortedSwaps =
    swapsQuery?.swaps.sort(
      (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
    ) || [];

  // add an artifial data point at the current timestamp
  // could also use the uniswap Pool object and fetch price
  // TODO consider fetching mark from contract? But need to convert back to sqrtPriceX96
  if (sortedSwaps.length > 0) {
    sortedSwaps.push({
      sqrtPriceX96: sortedSwaps[sortedSwaps.length - 1].sqrtPriceX96,
      timestamp: now,
    });
  }

  let dprValues: ChartValue[] = [];
  for (let { sqrtPriceX96, timestamp } of sortedSwaps) {
    const scaledMarkDPR = price(sqrtPriceX96, baseCurrency, quoteCurrency)
      .sub(ONE)
      .div(ethers.BigNumber.from(timestamp).sub(strategy.createdAt).toString())
      .mul(SECONDS_IN_A_DAY);

    const markDPR = convertONEScaledPercent(scaledMarkDPR, 4);

    dprValues.push([markDPR, parseInt(timestamp)]);
  }

  return dprValues;
}

// TODO Slightly lighter weight than using Uniswap
// double check this when decimals change, should match
// new Price(
//     subgraphTokenToToken(baseCurrency),
//     subgraphTokenToToken(quoteCurrency),
//   Q192.toString(),
//   ethers.BigNumber.from(sqrtPriceX96).mul(sqrtPriceX96).toString(),
// ).toFixed()
//
function price(
  sqrtPriceX96: string,
  baseCurrency: UniSubgraphToken,
  quoteCurrency: UniSubgraphToken,
): ethers.BigNumber {
  const p = ethers.BigNumber.from(sqrtPriceX96).pow(2).mul(ONE).div(Q192);
  const baseScalar = ethers.BigNumber.from(10).pow(baseCurrency.decimals);
  const quoteScalar = ethers.BigNumber.from(10).pow(quoteCurrency.decimals);
  // might not want big nums here? Need to make sure we allow for decimals?
  // maybe easier just to use uniswap :)
  const scalar = baseScalar.mul(100).div(quoteScalar);
  return p.mul(scalar).div(100);
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
