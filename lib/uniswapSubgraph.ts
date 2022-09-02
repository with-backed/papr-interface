import {
  PoolByIdDocument,
  PoolByIdQuery,
  SqrtPricesByPoolDocument,
  SqrtPricesByPoolQuery,
  SwapsByPoolDocument,
  SwapsByPoolQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { clientFromUrl } from './urql';

export async function subgraphUniswapPriceByPool(pool: string) {
  // TODO: dynamic client address
  const client = clientFromUrl(
    'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-rinkeby',
  );
  const { data, error } = await client
    .query<SqrtPricesByPoolQuery>(SqrtPricesByPoolDocument, {
      id: pool,
      pool: pool,
    })
    .toPromise();

  if (error) {
    console.error(error);
    return null;
  }

  return data || null;
}

export async function subgraphUniswapSwapsByPool(pool: string) {
  // TODO: dynamic client address
  const client = clientFromUrl(
    'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-rinkeby',
  );
  const { data, error } = await client
    .query<SwapsByPoolQuery>(SwapsByPoolDocument, { pool: pool })
    .toPromise();

  if (error) {
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
    return null;
  }

  return data || null;
}
