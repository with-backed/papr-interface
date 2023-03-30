import { CurrencyAmount, Price, Token } from '@uniswap/sdk-core';
import { priceToClosestTick, TickMath } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import { ActivityType } from 'hooks/useActivity/useActivity';
import { PaprController } from 'hooks/useController';
import { price } from 'lib/controllers/charts/mark';
import { computeDeltasFromActivities } from 'lib/controllers/uniswap';
import { uniTokenToErc20Token } from 'lib/uniswapSubgraph';

export function transformLPActivityToSwap(
  lpActivity: ActivityType,
  previousLPActivity: ActivityType | undefined,
  controller: PaprController,
  token0: Token,
  token1: Token,
  chainId: number,
): ActivityType {
  if (!previousLPActivity) return lpActivity;

  const { token0IsUnderlying, underlying, paprToken } = controller;

  const [amount0Delta, amount1Delta] = computeDeltasFromActivities(
    lpActivity,
    previousLPActivity,
    token0IsUnderlying,
    paprToken,
    underlying,
    chainId,
  );
  if (
    checkZero(amount0Delta, token0.decimals) ||
    checkZero(amount1Delta, token1.decimals)
  )
    return lpActivity;

  const price = new Price({
    baseAmount: CurrencyAmount.fromRawAmount(
      token0,
      amount0Delta.abs().toString(),
    ),
    quoteAmount: CurrencyAmount.fromRawAmount(
      token1,
      amount1Delta.abs().toString(),
    ),
  });
  const closestTick = priceToClosestTick(price);
  const sqrtPrice = TickMath.getSqrtRatioAtTick(closestTick);

  return {
    ...lpActivity,
    amountIn: amount0Delta.isNegative()
      ? amount0Delta.abs()
      : amount1Delta.abs(),
    amountOut: amount0Delta.isNegative()
      ? amount1Delta.abs()
      : amount0Delta.abs(),
    tokenIn: amount0Delta.isNegative()
      ? uniTokenToErc20Token(token0)
      : uniTokenToErc20Token(token1),
    tokenOut: amount0Delta.isNegative()
      ? uniTokenToErc20Token(token1)
      : uniTokenToErc20Token(token0),
    sqrtPricePool: sqrtPrice.toString(),
  };
}

export function computeWeightedAveragePrices(
  swapActivities: ActivityType[],
  amount: 'amountIn' | 'amountOut',
  token: 'tokenIn' | 'tokenOut',
  token0IsUnderlying: boolean,
  token0: Token,
  token1: Token,
) {
  const amountsNumbers = swapActivities.map((a) => {
    return parseFloat(
      ethers.utils.formatUnits(
        ethers.BigNumber.from(a[amount]),
        a[token]!.decimals,
      ),
    );
  });
  const totalAmount = amountsNumbers.reduce((a, b) => {
    return a + b;
  }, 0);
  const weights = amountsNumbers.map((amount) => {
    return amount / totalAmount;
  });

  return swapActivities
    .map((a, i) => {
      const p = parseFloat(
        price(
          ethers.BigNumber.from(a.sqrtPricePool),
          token0IsUnderlying ? token1 : token0,
          token0IsUnderlying ? token0 : token1,
          token1,
        ).toFixed(4),
      );
      return p * weights[i];
    })
    .reduce((a, b) => a + b, 0);
}

// uniswap helper methods that return liquidity amounts sometime come back as -1e-18 or 1e-18
// this is a small check to fix that we do not compute these tiny amounts as swaps
function checkZero(bn: ethers.BigNumber, decimals: number) {
  const float = parseFloat(ethers.utils.formatUnits(bn, decimals));
  return float === 0 || float === -1e-18 || float === 1e-18;
}
