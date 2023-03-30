import {
  AuctionDocument,
  AuctionQuery,
  PaprControllerByIdDocument,
  PaprControllerByIdQuery,
  PaprControllersDocument,
  PaprControllersQuery,
  VaultsByOwnerForControllerDocument,
  VaultsByOwnerForControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';

import { configs, SupportedToken } from './config';
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
