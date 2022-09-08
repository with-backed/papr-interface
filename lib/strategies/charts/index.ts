import { ethers } from 'ethers';
import { ChartValue } from 'lib/d3';
import { subgraphUniswapPoolById } from 'lib/uniswapSubgraph';
import { LendingStrategy } from 'types/generated/graphql/inKindSubgraph';
import { Pool } from 'types/generated/graphql/uniswapSubgraph';
import { convertONEScaledPercent, convertOneScaledValue } from '..';
import { markValues } from './mark';
import { normValues } from './norm';

export interface StrategyPricesData {
  normalizationDPRValues: ChartValue[];
  markDPRValues: ChartValue[];
  indexDPRValues: ChartValue[];
  index: number;
  mark: number;
  norm: number;
}

export async function strategyPricesData(
  strategy: LendingStrategy,
): Promise<StrategyPricesData> {
  const targetDPRScaled = ethers.BigNumber.from(strategy.targetAPR).div(365);
  const targetDPR = convertONEScaledPercent(targetDPRScaled, 4);
  const now = Math.floor(Date.now() / 1000);
  const subgraphUniswapPool = await subgraphUniswapPoolById(
    strategy.poolAddress,
  );
  const createdAt = parseInt(strategy.createdAt);

  var marks: ChartValue[] = [];
  if (subgraphUniswapPool) {
    marks = await markValues(now, strategy, subgraphUniswapPool.pool as Pool);
  }

  const norms = await normValues(now, strategy);

  // add a starting data point all on target
  marks.unshift([targetDPR, createdAt]);
  norms.unshift([targetDPR, createdAt]);

  return {
    index: targetDPR,
    mark: marks[marks.length - 1][0],
    norm: norms[norms.length - 1][0],
    normalizationDPRValues: norms,
    markDPRValues: marks,
    indexDPRValues: indexValues(targetDPR, createdAt, now),
  };
}

function indexValues(
  targetDPR: number,
  start: number,
  now: number,
): ChartValue[] {
  return [
    [targetDPR, start],
    [targetDPR, now],
  ];
}
