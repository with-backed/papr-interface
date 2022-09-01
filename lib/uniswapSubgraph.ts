import {
  PoolByIdDocument,
  PoolByIdQuery,
  SqrtPricesByPoolDocument,
  SqrtPricesByPoolQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { clientFromUrl } from './urql';

export async function subgraphUniswapPriceByPool(pool: string) {
  // TODO: dynamic client address
  const client = clientFromUrl(
    'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-rinkeby',
  );
  const { data, error } = await client
    .query<SqrtPricesByPoolQuery>(SqrtPricesByPoolDocument, { pool })
    .toPromise();

  if (error) {
    console.error(error);
    return null;
  }

  return data || null;
}

export async function subgraphUniswapPoolById(id: string) {
  // TODO: dynamic client address
  const client = clientFromUrl(
    'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-rinkeby',
  );
  const { data, error } = await client
    .query<PoolByIdQuery>(PoolByIdDocument, { id })
    .toPromise();

  if (error) {
    console.error(error);
    return null;
  }

  return data || null;
}
