import { Price, Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { Q192 } from 'lib/constants';
import { Token as UniSubgraphToken } from 'types/generated/graphql/uniswapSubgraph';

export function price(
  sqrtPriceX96: number,
  baseCurrency: UniSubgraphToken,
  quoteCurrency: UniSubgraphToken,
  token0: UniSubgraphToken,
): Price<Token, Token> {
  return new Price(
    subgraphTokenToToken(baseCurrency),
    subgraphTokenToToken(quoteCurrency),
    token0.id !== quoteCurrency.id
      ? Q192.toString()
      : ethers.BigNumber.from(sqrtPriceX96).mul(sqrtPriceX96).toString(),
    token0.id === quoteCurrency.id
      ? Q192.toString()
      : ethers.BigNumber.from(sqrtPriceX96).mul(sqrtPriceX96).toString(),
  );
}

function subgraphTokenToToken(token: UniSubgraphToken): Token {
  return new Token(
    1,
    token.id,
    parseInt(token.decimals),
    token.symbol,
    token.name,
  );
}
