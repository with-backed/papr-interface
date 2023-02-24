import { Token } from '@uniswap/sdk-core';
import {
  PoolByIdDocument,
  PoolByIdQuery,
  SqrtPricesByPoolDocument,
  SqrtPricesByPoolQuery,
  SwapsByPoolDocument,
  SwapsByPoolQuery,
  Token as UniSubgraphToken,
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

export function uniSubgraphTokenToToken(
  token: UniSubgraphToken,
  chainId: number,
): Token {
  return new Token(
    chainId,
    token.id,
    parseInt(token.decimals),
    token.symbol,
    token.name,
  );
}

export function erc20TokenToToken(token: ERC20Token, chainId: number): Token {
  return new Token(chainId, token.id, token.decimals, token.symbol, token.name);
}
