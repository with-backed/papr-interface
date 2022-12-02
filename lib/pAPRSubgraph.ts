import {
  PaprControllersDocument,
  PaprControllersQuery,
  PaprControllerByIdDocument,
  PaprControllerByIdQuery,
  VaultsByOwnerForControllerDocument,
  VaultsByOwnerForControllerQuery,
  PaprHeroPlayersDocument,
  PaprHeroPlayersQuery,
  User,
} from 'types/generated/graphql/inKindSubgraph';
import { configs, SupportedToken } from './config';
import { PaprController, SubgraphController } from './PaprController';
import { clientFromUrl } from './urql';

export async function subgraphControllerByAddress(
  id: string,
  token: SupportedToken,
) {
  // TODO: dynamic client address
  const client = clientFromUrl(configs[token].paprMemeSubgraph);
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
  const client = clientFromUrl(configs[token].paprMemeSubgraph);
  const { data, error } = await client
    .query<PaprControllersQuery>(PaprControllersDocument, {})
    .toPromise();

  if (error) {
    console.error(error);
    return [];
  }

  return data?.paprControllers || [];
}

export async function getAllPaprHeroPlayers(
  token: SupportedToken,
): Promise<User[] | null> {
  const client = clientFromUrl(configs[token].paprMemeSubgraph);
  const { data, error } = await client
    .query<PaprHeroPlayersQuery>(PaprHeroPlayersDocument, {})
    .toPromise();

  if (error) {
    console.error(error);
    return [];
  }

  return data?.users || [];
}

export async function getAllVaultsForControllerForUser(
  controller: string,
  owner: string,
  token: SupportedToken,
) {
  const client = clientFromUrl(configs[token].paprMemeSubgraph);
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
