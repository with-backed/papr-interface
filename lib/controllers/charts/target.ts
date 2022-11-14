import { ethers } from 'ethers';
import { configs, SupportedToken } from 'lib/config';
import { ONE } from 'lib/constants';
import { TimeSeriesValue } from '.';
import { PaprController, SubgraphController } from 'lib/PaprController';
import { clientFromUrl } from 'lib/urql';
import { PaprController__factory } from 'types/generated/abis';
import {
  TargetUpdatesByControllerDocument,
  TargetUpdatesByControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { computeRate, RatePeriod } from '..';
import { UTCTimestamp } from 'lightweight-charts';

interface TargetUpdate {
  newTarget: string;
  timestamp: string;
}

export async function targetValues(
  now: number,
  controller: PaprController | SubgraphController,
  token: SupportedToken,
): Promise<[TimeSeriesValue[], TimeSeriesValue[]]> {
  const result = await subgraphNormalizationUpdatesForController(controller.id);

  const sortedNorms: TargetUpdate[] =
    result?.targetUpdates.sort(
      (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
    ) || [];

  // get what norm would be if updated at this moment and add to array
  if (sortedNorms.length > 0) {
    sortedNorms.push({
      newTarget: await getNewNorm(controller.id, token),
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
      ethers.BigNumber.from(prev.newTarget),
      ethers.BigNumber.from(current.newTarget),
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
        ethers.utils.formatEther(ethers.BigNumber.from(current.newTarget)),
      ),
      time: t as UTCTimestamp,
    });
  }

  return [formattedNorms, normDPRs];
}

async function getNewNorm(
  controllerAddress: string,
  token: SupportedToken,
): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(
    configs[token].jsonRpcProvider,
  );
  const s = PaprController__factory.connect(controllerAddress, provider);
  return (await s.newTarget()).toString();
}

async function subgraphNormalizationUpdatesForController(controller: string) {
  // TODO: dynamic client address
  const client = clientFromUrl(
    'https://api.goldsky.com/api/public/project_cl9fqfatx1kql0hvkak9eesug/subgraphs/papr-goerl/0.1.0/gn',
  );
  const { data, error } = await client
    .query<TargetUpdatesByControllerQuery>(TargetUpdatesByControllerDocument, {
      controller,
    })
    .toPromise();

  if (error) {
    console.log(error);
    return null;
  }

  return data || null;
}
