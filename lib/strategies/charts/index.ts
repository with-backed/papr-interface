import { ethers } from 'ethers';
import { SupportedToken } from 'lib/config';
import { LendingStrategy, SubgraphStrategy } from 'lib/LendingStrategy';
import { subgraphUniswapPoolById } from 'lib/uniswapSubgraph';
import { UTCTimestamp } from 'lightweight-charts';
import { Pool } from 'types/generated/graphql/uniswapSubgraph';
import { markValues } from './mark';
import { normValues } from './norm';

export interface TimeSeriesValue {
  value: number;
  time: UTCTimestamp;
}

export interface StrategyPricesData {
  normalizationDPRValues: TimeSeriesValue[];
  markDPRValues: TimeSeriesValue[];
  indexDPRValues: TimeSeriesValue[];
  markValues: TimeSeriesValue[];
  normalizationValues: TimeSeriesValue[];
  index: number;
  indexDPR: number;
}

export async function strategyPricesData(
  strategy: LendingStrategy | SubgraphStrategy,
  token: SupportedToken,
  uniswapSubgraphUrl: string,
): Promise<StrategyPricesData> {
  const now = Math.floor(Date.now() / 1000);
  const subgraphUniswapPool = await subgraphUniswapPoolById(
    strategy.poolAddress,
    uniswapSubgraphUrl,
  );
  const createdAt = parseInt(strategy.createdAt);

  const index = 1;

  var markDPRs: TimeSeriesValue[] = [];
  var marks: TimeSeriesValue[] = [];
  if (subgraphUniswapPool) {
    [marks, markDPRs] = await markValues(
      now,
      strategy,
      subgraphUniswapPool.pool as Pool,
      uniswapSubgraphUrl,
    );
  }

  const [norms, normDPRs] = await normValues(now, strategy, token);

  // add a starting data point all on target
  markDPRs.unshift({ value: 0, time: createdAt as UTCTimestamp });
  normDPRs.unshift({ value: 0, time: createdAt as UTCTimestamp });

  // each unique timestamp from the datasets, sorted ascending. Use this to
  // make sure we have an index entry for each other value
  const timestamps = Array.from(
    new Set([
      ...markDPRs.map(({ time }) => time),
      ...normDPRs.map(({ time }) => time),
    ]),
  ).sort((a, b) => a - b);

  return {
    indexDPR: 0,
    index: parseFloat(ethers.utils.formatEther(index)),
    normalizationDPRValues: normDPRs,
    normalizationValues: norms,
    markValues: marks,
    markDPRValues: markDPRs,
    indexDPRValues: indexValues(0, timestamps),
  };
}

function indexValues(
  targetDPR: number,
  timestamps: UTCTimestamp[],
): TimeSeriesValue[] {
  return timestamps.map((t) => {
    return { value: targetDPR, time: t };
  });
}
