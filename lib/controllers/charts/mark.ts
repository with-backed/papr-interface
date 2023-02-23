import { Price, Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { Q192 } from 'lib/constants';
import { UTCTimestamp } from 'lightweight-charts';
import {
  SwapsByPoolQuery,
  Token as UniSubgraphToken,
} from 'types/generated/graphql/uniswapSubgraph';

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

/**
 * On one swap there was a tremendous market price which ruins the chart.
 * Let's filter that one out.
 */
const OUTLIER_TIMESTAMP = 1675965383;

export function marks(
  swaps: SwapsByPoolQuery['swaps'],
  baseCurrency: UniSubgraphToken,
  quoteCurrency: UniSubgraphToken,
  token0: UniSubgraphToken,
) {
  const now = Math.floor(Date.now() / 1000);

  const sortedSwaps = [...swaps].sort(
    (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
  );

  const formattedSwaps = sortedSwaps.map(({ sqrtPriceX96, timestamp }) => {
    return {
      value: parseFloat(
        price(sqrtPriceX96, baseCurrency, quoteCurrency, token0).toFixed(),
      ),
      time: parseInt(timestamp) as UTCTimestamp,
    };
  });

  if (formattedSwaps.length > 0) {
    formattedSwaps.push({
      value: formattedSwaps[formattedSwaps.length - 1].value,
      time: now as UTCTimestamp,
    });
  }

  const result: typeof formattedSwaps = [];
  const seenTimestamps = new Set([OUTLIER_TIMESTAMP]);
  formattedSwaps.forEach((swap) => {
    if (seenTimestamps.has(swap.time)) {
      return;
    }
    if (swap.value > 10000) {
      return;
    }
    seenTimestamps.add(swap.time);
    result.push(swap);
  });

  return result;
}
