import { ethers } from 'ethers';
import { configs, SupportedNetwork } from 'lib/config';
import { ONE } from 'lib/constants';
import { TimeSeriesValue } from '../charts';
import { LendingStrategy, SubgraphStrategy } from 'lib/LendingStrategy';
import { clientFromUrl } from 'lib/urql';
import { Strategy__factory } from 'types/generated/abis';
import {
  NormalizationUpdatesByStrategyDocument,
  NormalizationUpdatesByStrategyQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { computeRate, RatePeriod } from '..';
import { UTCTimestamp } from 'lightweight-charts';

interface NormUpdate {
  newNorm: string;
  timestamp: string;
}

export async function normValues(
  now: number,
  strategy: LendingStrategy | SubgraphStrategy,
  network: SupportedNetwork,
): Promise<[TimeSeriesValue[], TimeSeriesValue[]]> {
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

  const normDPRs: TimeSeriesValue[] = [];
  const formattedNorms: TimeSeriesValue[] = [];

  for (let i = 1; i < sortedNorms.length; i++) {
    const prev = sortedNorms[i - 1];
    const current = sortedNorms[i];
    const t = parseInt(current.timestamp);
    const dpr = computeRate(
      ethers.BigNumber.from(prev.newNorm),
      ethers.BigNumber.from(current.newNorm),
      parseInt(prev.timestamp),
      t,
      RatePeriod.Daily,
    );

    normDPRs.push({
      value: dpr,
      time: t as UTCTimestamp,
    });
    formattedNorms.push({
      value: parseFloat(
        ethers.utils.formatEther(ethers.BigNumber.from(current.newNorm)),
      ),
      time: t as UTCTimestamp,
    });
  }

  return [formattedNorms, normDPRs];
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
