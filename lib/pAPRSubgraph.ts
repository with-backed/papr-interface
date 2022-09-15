import {
  LendingStrategiesDocument,
  LendingStrategiesQuery,
  LendingStrategyByIdDocument,
  LendingStrategyByIdQuery,
  VaultsByOwnerDocument,
  VaultsByOwnerForStrategyDocument,
  VaultsByOwnerForStrategyQuery,
  VaultsByOwnerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { LendingStrategy } from './strategies';
import { clientFromUrl } from './urql';
import { LendingStrategy as SubgraphLendingStrategy } from 'types/generated/graphql/inKindSubgraph';

export async function subgraphStrategyByAddress(id: string) {
  // TODO: dynamic client address
  const client = clientFromUrl(
    'https://api.thegraph.com/subgraphs/name/adamgobes/sly-fox',
  );
  const { data, error } = await client
    .query<LendingStrategyByIdQuery>(LendingStrategyByIdDocument, { id })
    .toPromise();

  if (error) {
    console.error(error);
    return null;
  }

  return data || null;
}

export async function getNextVaultNonceForUser(
  strategy: LendingStrategy,
  owner: string,
) {
  const client = clientFromUrl(
    'https://api.thegraph.com/subgraphs/name/adamgobes/sly-fox',
  );
  const { data, error } = await client
    .query<VaultsByOwnerForStrategyQuery>(VaultsByOwnerForStrategyDocument, {
      owner: owner.toLowerCase(),
      strategy: strategy.contract.address.toLowerCase(),
    })
    .toPromise();

  if (error) {
    console.error(error);
    return null;
  }

  if (data?.vaults.length === 0) return 0;

  return data || null;
}

export async function getAllStrategies() {
  const client = clientFromUrl(
    'https://api.thegraph.com/subgraphs/name/adamgobes/sly-fox',
  );
  const { data, error } = await client
    .query<LendingStrategiesQuery>(LendingStrategiesDocument, {})
    .toPromise();

  if (error) {
    console.error(error);
    return [];
  }

  return data?.lendingStrategies || [];
}
