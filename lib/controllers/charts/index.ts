import { ethers } from 'ethers';
import { SupportedToken } from 'lib/config';
import { SubgraphController } from 'lib/PaprController';
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
  markValues: TimeSeriesValue[];
  targetValues: TimeSeriesValue[];
  index: number;
}

export async function controllerPricesData_deprecated(
  controller: SubgraphController,
  token: SupportedToken,
  uniswapSubgraphUrl: string,
): Promise<ControllerPricesData> {
  const now = Math.floor(Date.now() / 1000);
  const subgraphUniswapPool = await subgraphUniswapPoolById(
    controller.poolAddress,
    uniswapSubgraphUrl,
  );

  if (!subgraphUniswapPool) {
    throw new Error(
      `could not find uniswap pool ${controller.poolAddress} in subgraph.`,
    );
  }

  const index = 1;

  const [[marks], [targets]] = await Promise.all([
    markValues(
      now,
      controller,
      subgraphUniswapPool.pool as Pool,
      uniswapSubgraphUrl,
    ),
    targetValues(now, controller, subgraphUniswapPool.pool as Pool, token),
  ]);

  return {
    index: parseFloat(ethers.utils.formatEther(index)),
    targetValues: targets,
    markValues: marks,
  };
}
