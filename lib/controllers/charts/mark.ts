import { Price, Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { Q192 } from 'lib/constants';

export function price(
  sqrtPriceX96: ethers.BigNumber,
  baseCurrency: Token,
  quoteCurrency: Token,
  token0: Token,
): Price<Token, Token> {
  return new Price(
    baseCurrency,
    quoteCurrency,
    token0.address !== quoteCurrency.address
      ? Q192.toString()
      : sqrtPriceX96.mul(sqrtPriceX96).toString(),
    token0.address === quoteCurrency.address
      ? Q192.toString()
      : sqrtPriceX96.mul(sqrtPriceX96).toString(),
  );
}
