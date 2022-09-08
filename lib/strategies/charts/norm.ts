import { ethers } from 'ethers';
import { configs, SupportedNetwork } from 'lib/config';
import { ONE } from 'lib/constants';
import { ChartValue } from 'lib/d3';
import { clientFromUrl } from 'lib/urql';
import {
  StrategyFactory__factory,
  Strategy__factory,
} from 'types/generated/abis';
import {
  LendingStrategy,
  Maybe,
  NormalizationUpdatesByStrategyDocument,
  NormalizationUpdatesByStrategyQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { computeEffectiveDPR } from '..';

interface NormUpdate {
  newNorm: string;
  timestamp: string;
}

export async function normValues(
  now: number,
  strategy: LendingStrategy,
  network: SupportedNetwork,
): Promise<ChartValue[]> {
  const result = await subgraphNormalizationUpdatesForStrategy(strategy.id);

  const sortedNorms: NormUpdate[] =
    result?.normalizationUpdates.sort(
      (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
    ) || [];

  // get what norm would be if updated at this moment and add to array
  if (sortedNorms.length > 0) {
    sortedNorms.push({
      newNorm: await getNewNorm(strategy.id, network),
      timestamp: now.toString(),
    });
  }

  const normDPRs: ChartValue[] = [];

  for (let i = 1; i < sortedNorms.length; i++) {
    const prev = sortedNorms[i - 1];
    const current = sortedNorms[i];
    const dpr = computeEffectiveDPR(
      ethers.BigNumber.from(current.timestamp),
      ethers.BigNumber.from(prev.timestamp),
      ethers.BigNumber.from(current.newNorm).mul(ONE).div(prev.newNorm),
    );
    normDPRs.push([dpr, parseInt(current.timestamp)]);
  }

  return normDPRs;
}

async function getNewNorm(
  strategyAddress: string,
  network: SupportedNetwork,
): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(
    configs[network].jsonRpcProvider,
  );
  const s = Strategy__factory.connect(strategyAddress, provider);
  return (await s.newNorm()).toString();
}

async function subgraphNormalizationUpdatesForStrategy(strategy: string) {
  // TODO: dynamic client address
  const client = clientFromUrl(
    'https://api.thegraph.com/subgraphs/name/adamgobes/sly-fox',
  );
  const { data, error } = await client
    .query<NormalizationUpdatesByStrategyQuery>(
      NormalizationUpdatesByStrategyDocument,
      { strategy },
    )
    .toPromise();

  if (error) {
    console.log(error);
    return null;
  }

  return data || null;
}
