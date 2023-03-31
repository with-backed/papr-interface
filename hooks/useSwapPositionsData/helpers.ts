import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { ActivityType } from 'hooks/useActivity/useActivity';
import { price } from 'lib/controllers/charts/mark';

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
export function checkZero(bn: ethers.BigNumber, decimals: number) {
  const float = parseFloat(ethers.utils.formatUnits(bn, decimals));
  return float === 0 || float === -1e-18 || float === 1e-18;
}
