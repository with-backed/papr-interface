import { Token } from '@uniswap/sdk-core';
import {
  PoolByIdDocument,
  PoolByIdQuery,
  SqrtPricesByPoolDocument,
  SqrtPricesByPoolQuery,
  SwapsByPoolDocument,
  SwapsByPoolQuery,
} from 'types/generated/graphql/uniswapSubgraph';

import { ERC20Token } from './controllers';
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
    .query<SwapsByPoolQuery>(SwapsByPoolDocument, { pool: pool })
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

export function subgraphTokenToToken(token: ERC20Token, chainId: number) {
  return new Token(chainId, token.id, token.decimals, token.symbol, token.name);
}
