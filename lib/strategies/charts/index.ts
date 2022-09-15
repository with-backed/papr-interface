import { ethers } from 'ethers';
import { configs, SupportedNetwork } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import { ChartValue } from 'lib/d3';
import { subgraphUniswapPoolById } from 'lib/uniswapSubgraph';
import { Strategy__factory } from 'types/generated/abis';
import { LendingStrategy } from 'types/generated/graphql/inKindSubgraph';
import { Pool } from 'types/generated/graphql/uniswapSubgraph';
import { convertONEScaledPercent, convertOneScaledValue } from '..';
import { markValues } from './mark';
import { normValues } from './norm';

export interface StrategyPricesData {
  normalizationDPRValues: ChartValue[];
  markDPRValues: ChartValue[];
  indexDPRValues: ChartValue[];
  markValues: string[];
  normalizationValues: string[];
  index: number;
  indexDPR: number;
}

export async function strategyPricesData(
  strategy: LendingStrategy,
  network: SupportedNetwork,
): Promise<StrategyPricesData> {
  const targetDPRScaled = ethers.BigNumber.from(strategy.targetAPR).div(365);
  const targetDPR = convertONEScaledPercent(targetDPRScaled, 4);
  const now = Math.floor(Date.now() / 1000);
  const subgraphUniswapPool = await subgraphUniswapPoolById(
    strategy.poolAddress,
  );
  const createdAt = parseInt(strategy.createdAt);

  const index = await Strategy__factory.connect(
    strategy.id,
    makeProvider(configs[network].jsonRpcProvider, network as SupportedNetwork),
  ).index();

  var markDPRs: ChartValue[] = [];
  var marks: string[] = [];
  if (subgraphUniswapPool) {
    [marks, markDPRs] = await markValues(
      now,
      strategy,
      subgraphUniswapPool.pool as Pool,
    );
  }

  const [norms, normDPRs] = await normValues(now, strategy, network);

  // add a starting data point all on target
  markDPRs.unshift([targetDPR, createdAt]);
  normDPRs.unshift([targetDPR, createdAt]);

  return {
    indexDPR: targetDPR,
    index: parseFloat(ethers.utils.formatEther(index)),
    normalizationDPRValues: normDPRs,
    normalizationValues: norms,
    markValues: marks,
    markDPRValues: markDPRs,
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
