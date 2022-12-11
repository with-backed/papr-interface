import {
  PoolByIdDocument,
  PoolByIdQuery,
  SqrtPricesByPoolDocument,
  SqrtPricesByPoolQuery,
  SwapsByPoolDocument,
  SwapsByPoolQuery,
} from 'types/generated/graphql/uniswapSubgraph';

import { clientFromUrl } from './urql';

export async function subgraphUniswapPriceByPool(
  pool: string,
  uniswapSubgraphUrl: string,
) {
  const client = clientFromUrl(uniswapSubgraphUrl);
  const { data, error } = await client
    .query<SqrtPricesByPoolQuery>(SqrtPricesByPoolDocument, { pool })
    .toPromise();

  if (error) {
    console.error(error);
    return null;
  }

  return data || null;
}

export async function subgraphUniswapSwapsByPool(
  pool: string,
  uniswapSubgraphUrl: string,
) {
  const client = clientFromUrl(uniswapSubgraphUrl);
  const { data, error } = await client
    .query<SwapsByPoolQuery>(SwapsByPoolDocument, { pool })
    .toPromise();

  if (error) {
    console.log(error);
    return null;
  }

  return data || null;
}

export async function subgraphUniswapPoolById(
  id: string,
  uniswapSubgraphUrl: string,
) {
  const client = clientFromUrl(uniswapSubgraphUrl);
  const { data, error } = await client
    .query<PoolByIdQuery>(PoolByIdDocument, { id })
    .toPromise();

  if (error) {
    console.log(error);
    return null;
  }

  return data || null;
}
