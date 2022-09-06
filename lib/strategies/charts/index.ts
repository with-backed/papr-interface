import { Price, Token } from '@uniswap/sdk-core';
import { trace } from 'console';
import { ethers } from 'ethers';
import { ONE, Q192, SECONDS_IN_A_DAY } from 'lib/constants';
import { ChartValue } from 'lib/d3';
import { subgraphUniswapSwapsByPool } from 'lib/uniswapSubgraph';
import { LendingStrategy } from 'types/generated/graphql/inKindSubgraph';
import {
  Pool,
  Token as UniSubgraphToken,
} from 'types/generated/graphql/uniswapSubgraph';
import { convertONEScaledPercent, convertOneScaledValue } from '..';

interface StrategyTimeSeriesChartData {
  normalizationDPRValues: ChartValue[];
  markDPRValues: ChartValue[];
  indexDPRValues: ChartValue[];
  index: number;
  mark: number;
  norm: number;
}

export async function strategyPricesData(
  strategy: LendingStrategy,
  pool: Pool,
): Promise<StrategyTimeSeriesChartData> {
  let quoteCurrency;
  let baseCurrency;
  if (strategy.underlying == pool.token0) {
    quoteCurrency = pool.token1;
    baseCurrency = pool.token0;
  } else {
    quoteCurrency = pool.token0;
    baseCurrency = pool.token1;
  }

  // change token based on which is which
  const marks = await markValues(
    0.2 / 365,
    strategy.createdAt,
    pool.token0,
    pool.token1,
    strategy.poolAddress,
  );

  return {
    index: 1,
    mark: 1,
    norm: 1,
    normalizationDPRValues: [],
    markDPRValues: marks,
    indexDPRValues: [],
  };
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
  const scalar = baseScalar.div(quoteScalar);
  return p.mul(scalar);
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

async function markValues(
  targetDPR: number,
  createdAt: string,
  quoteCurrency: UniSubgraphToken,
  baseCurrency: UniSubgraphToken,
  pool: string,
): Promise<ChartValue[]> {
  const swapsQuery = await subgraphUniswapSwapsByPool(pool);
  if (swapsQuery == undefined) return [];
  const swaps = swapsQuery.swaps;

  // add an artifial data point at the current timestamp
  // could also use the uniswap Pool object and fetch price
  if (swaps.length > 0) {
    swaps.push({
      sqrtPriceX96: swaps[swaps.length - 1].sqrtPriceX96,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }

  let dprValues: ChartValue[] = [];
  for (let { sqrtPriceX96, timestamp } of swapsQuery['swaps']) {
    const scaledMarkDPR = price(sqrtPriceX96, baseCurrency, quoteCurrency)
      .sub(ONE)
      .div(ethers.BigNumber.from(timestamp).sub(createdAt).toString())
      .mul(SECONDS_IN_A_DAY);

    const markDPR = convertONEScaledPercent(scaledMarkDPR, 4);

    dprValues.push([markDPR, parseInt(timestamp)]);
  }

  // add an initial datapoint, assuming it is on target
  dprValues.unshift([targetDPR, parseInt(createdAt)]);

  return dprValues;
}
