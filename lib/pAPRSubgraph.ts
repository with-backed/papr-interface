import { ethers } from 'ethers';
import { PaprController } from 'hooks/useController';
import {
  AuctionDocument,
  AuctionQuery,
  LpActivityByControllerAndAccountDocument,
  LpActivityByControllerAndAccountQuery,
  PaprControllerByIdDocument,
  PaprControllerByIdQuery,
  PaprControllersDocument,
  PaprControllersQuery,
  VaultsByOwnerForControllerDocument,
  VaultsByOwnerForControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';

import { configs, SupportedToken } from './config';
import { computeDeltasFromActivity } from './controllers/uniswap';
import { SubgraphController } from './PaprController';
import { clientFromUrl } from './urql';

export async function subgraphControllerByAddress(
  id: string,
  token: SupportedToken,
) {
  // TODO: dynamic client address
  const client = clientFromUrl(configs[token].paprSubgraph);
  const { data, error } = await client
    .query<PaprControllerByIdQuery>(PaprControllerByIdDocument, { id })
    .toPromise();

  if (error) {
    console.error(error);
    return null;
  }

  return data || null;
}

export async function getAllPaprControllers(
  token: SupportedToken,
): Promise<SubgraphController[]> {
  const client = clientFromUrl(configs[token].paprSubgraph);
  const { data, error } = await client
    .query<PaprControllersQuery>(PaprControllersDocument, {})
    .toPromise();

  if (error) {
    console.error(error);
    return [];
  }

  return data?.paprControllers || [];
}

export async function getAllVaultsForControllerForUser(
  controller: string,
  owner: string,
  token: SupportedToken,
) {
  const client = clientFromUrl(configs[token].paprSubgraph);
  const { data, error } = await client
    .query<VaultsByOwnerForControllerQuery>(
      VaultsByOwnerForControllerDocument,
      {
        controller,
        owner,
      },
    )
    .toPromise();

  if (error) {
    console.error(error);
    return [];
  }

  return data?.vaults || [];
}

export async function auctionById(auctionId: string, token: SupportedToken) {
  const client = clientFromUrl(configs[token].paprSubgraph);
  const { data, error } = await client
    .query<AuctionQuery>(AuctionDocument, {
      id: auctionId,
    })
    .toPromise();

  if (error) {
    console.error(error);
    return null;
  }

  return data?.auction || null;
}

export async function lpActivityForUser(
  controller: PaprController,
  account: string,
  token: SupportedToken,
) {
  const client = clientFromUrl(configs[token].paprSubgraph);
  const { data, error } = await client
    .query<LpActivityByControllerAndAccountQuery>(
      LpActivityByControllerAndAccountDocument,
      {
        controllerId: controller.id.toLowerCase(),
        account: account.toLowerCase(),
      },
    )
    .toPromise();

  if (error) {
    console.error(error);
    return [];
  }

  console.log({
    data: data?.activities,
  });

  const deltas = computeDeltasFromActivity(
    data!.activities[0],
    controller,
    configs[token].chainId,
  );

  console.log({
    deltas: [
      ethers.utils.formatUnits(deltas[0], 18),
      ethers.utils.formatUnits(deltas[1], 18),
    ],
  });

  return data?.activities || [];
}
