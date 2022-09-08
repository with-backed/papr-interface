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
    'https://thegraph.com/hosted-service/subgraph/liqwiz/uniswap-v3-goerli',
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

export async function subgraphUniswapSwapsByPool(pool: string) {
  // TODO: dynamic client address
  const client = clientFromUrl(
    'https://thegraph.com/hosted-service/subgraph/liqwiz/uniswap-v3-goerli',
  );
  const { data, error } = await client
    .query<SwapsByPoolQuery>(SwapsByPoolDocument, { pool: pool })
    .toPromise();

  if (error) {
    console.log(error);
    return null;
  }

  return data || null;
}

export async function subgraphUniswapPoolById(id: string) {
  // TODO: dynamic client address
  const client = clientFromUrl(
    'https://thegraph.com/hosted-service/subgraph/liqwiz/uniswap-v3-goerli',
  );
  const { data, error } = await client
    .query<PoolByIdQuery>(PoolByIdDocument, { id })
    .toPromise();

  if (error) {
    console.log(error);
    return null;
  }

  return data || null;
}
