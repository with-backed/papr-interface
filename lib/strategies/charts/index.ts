import { ethers } from 'ethers';
import { configs, SupportedNetwork } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import { LendingStrategy, SubgraphStrategy } from 'lib/LendingStrategy';
import { subgraphUniswapPoolById } from 'lib/uniswapSubgraph';
import { Strategy__factory } from 'types/generated/abis';
import { Pool } from 'types/generated/graphql/uniswapSubgraph';
import { convertONEScaledPercent } from '..';
import { markValues } from './mark';
import { normValues } from './norm';

export type ChartValue = [number, number];

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
  strategy: LendingStrategy | SubgraphStrategy,
  network: SupportedNetwork,
  uniswapSubgraphUrl: string,
): Promise<StrategyPricesData> {
  const targetDPRScaled = ethers.BigNumber.from(strategy.targetAPR).div(365);
  const targetDPR = convertONEScaledPercent(targetDPRScaled, 4);
  const now = Math.floor(Date.now() / 1000);
  const subgraphUniswapPool = await subgraphUniswapPoolById(
    strategy.poolAddress,
    uniswapSubgraphUrl,
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
      uniswapSubgraphUrl,
    );
  }

  const [norms, normDPRs] = await normValues(now, strategy, network);

  // add a starting data point all on target
  markDPRs.unshift([targetDPR, createdAt]);
  normDPRs.unshift([targetDPR, createdAt]);

  // each unique timestamp from the datasets, sorted ascending. Use this to
  // make sure we have an index entry for each other value
  const timestamps = Array.from(
    new Set([
      ...markDPRs.map(([_, timestamp]) => timestamp),
      ...normDPRs.map(([_, timestamp]) => timestamp),
    ]),
  ).sort((a, b) => a - b);

  return {
    indexDPR: targetDPR,
    index: parseFloat(ethers.utils.formatEther(index)),
    normalizationDPRValues: normDPRs,
    normalizationValues: norms,
    markValues: marks,
    markDPRValues: markDPRs,
    indexDPRValues: indexValues(targetDPR, timestamps),
  };
}

function indexValues(targetDPR: number, timestamps: number[]): ChartValue[] {
  return timestamps.map((t) => [targetDPR, t]);
}
