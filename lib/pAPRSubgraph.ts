import {
  LendingStrategiesDocument,
  LendingStrategiesQuery,
  LendingStrategyByIdDocument,
  LendingStrategyByIdQuery,
  VaultsByOwnerForStrategyDocument,
  VaultsByOwnerForStrategyQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { LendingStrategy, SubgraphStrategy } from './LendingStrategy';
import { clientFromUrl } from './urql';

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
      strategy: strategy.id.toLowerCase(),
    })
    .toPromise();

  if (error) {
    console.error(error);
    return null;
  }

  if (data?.vaults.length === 0) return 0;

  const largestNonceVault = data?.vaults.sort((a, b) => b.nonce - a.nonce)[0];

  return largestNonceVault?.nonce || 0;
}

export async function getAllStrategies(): Promise<SubgraphStrategy[]> {
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
