import { ethers } from 'ethers';
import { SupportedNetwork } from 'lib/config';
import { LendingStrategy, SubgraphStrategy } from 'lib/LendingStrategy';
import { subgraphUniswapPoolById } from 'lib/uniswapSubgraph';
import { Pool } from 'types/generated/graphql/uniswapSubgraph';
import { markValues } from './mark';
import { normValues } from './norm';

export type ChartValue = [number, number];

export interface StrategyPricesData {
  normalizationDPRValues: ChartValue[];
  markDPRValues: ChartValue[];
  indexDPRValues: ChartValue[];
  markValues: ChartValue[];
  normalizationValues: ChartValue[];
  index: number;
  indexDPR: number;
}

export async function strategyPricesData(
  strategy: LendingStrategy | SubgraphStrategy,
  network: SupportedNetwork,
  uniswapSubgraphUrl: string,
): Promise<StrategyPricesData> {
  const now = Math.floor(Date.now() / 1000);
  const subgraphUniswapPool = await subgraphUniswapPoolById(
    strategy.poolAddress,
    uniswapSubgraphUrl,
  );
  const createdAt = parseInt(strategy.createdAt);

  const index = 1;

  var markDPRs: ChartValue[] = [];
  var marks: string[] = [];
  if (subgraphUniswapPool) {
    [marks, markDPRs] = await markValues(
      now,
      strategy,
      subgraphUniswapPool.pool as Pool,
      uniswapSubgraphUrl,
    );
  }

  const [norms, normDPRs] = await normValues(now, strategy, network);

  console.log(marks);
  console.log(norms);

  // add a starting data point all on target
  markDPRs.unshift([0, createdAt]);
  normDPRs.unshift([0, createdAt]);

  // each unique timestamp from the datasets, sorted ascending. Use this to
  // make sure we have an index entry for each other value
  const timestamps = Array.from(
    new Set([
      ...markDPRs.map(([_, timestamp]) => timestamp),
      ...normDPRs.map(([_, timestamp]) => timestamp),
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

function indexValues(targetDPR: number, timestamps: number[]): ChartValue[] {
  return timestamps.map((t) => [targetDPR, t]);
}
