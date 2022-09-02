import {
  LendingStrategyByIdDocument,
  LendingStrategyByIdQuery,
} from 'types/generated/graphql/inKindSubgraph';
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
