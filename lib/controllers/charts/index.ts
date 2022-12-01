import { ethers } from 'ethers';
import { SupportedToken } from 'lib/config';
import { PaprController, SubgraphController } from 'lib/PaprController';
import { subgraphUniswapPoolById } from 'lib/uniswapSubgraph';
import { UTCTimestamp } from 'lightweight-charts';
import { Pool } from 'types/generated/graphql/uniswapSubgraph';
import { markValues } from './mark';
import { targetValues } from './target';

export interface TimeSeriesValue {
  value: number;
  time: UTCTimestamp;
}

export interface ControllerPricesData {
  targetDPRValues: TimeSeriesValue[];
  markDPRValues: TimeSeriesValue[];
  indexDPRValues: TimeSeriesValue[];
  markValues: TimeSeriesValue[];
  targetValues: TimeSeriesValue[];
  index: number;
  indexDPR: number;
}

export async function controllerPricesData(
  controller: PaprController | SubgraphController,
  token: SupportedToken,
  uniswapSubgraphUrl: string,
): Promise<ControllerPricesData> {
  const now = Math.floor(Date.now() / 1000);
  const subgraphUniswapPool = await subgraphUniswapPoolById(
    controller.poolAddress,
    uniswapSubgraphUrl,
  );
  const createdAt = parseInt(controller.createdAt);

  const index = 1;

  var markDPRs: TimeSeriesValue[] = [];
  var marks: TimeSeriesValue[] = [];
  var targets: TimeSeriesValue[] = [];
  var targetDPRs: TimeSeriesValue[] = [];
  if (subgraphUniswapPool) {
    [marks, markDPRs] = await markValues(
      now,
      controller,
      subgraphUniswapPool.pool as Pool,
      uniswapSubgraphUrl,
    );
    [targets, targetDPRs] = await targetValues(
      now,
      controller,
      subgraphUniswapPool.pool as Pool,
      token,
    );
  }

  // add a starting data point all on target
  markDPRs.unshift({ value: 0, time: createdAt as UTCTimestamp });
  targetDPRs.unshift({ value: 0, time: createdAt as UTCTimestamp });

  // each unique timestamp from the datasets, sorted ascending. Use this to
  // make sure we have an index entry for each other value
  const timestamps = Array.from(
    new Set([
      ...markDPRs.map(({ time }) => time),
      ...targetDPRs.map(({ time }) => time),
    ]),
  ).sort((a, b) => a - b);

  return {
    indexDPR: 0,
    index: parseFloat(ethers.utils.formatEther(index)),
    targetDPRValues: targetDPRs,
    targetValues: targets,
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
