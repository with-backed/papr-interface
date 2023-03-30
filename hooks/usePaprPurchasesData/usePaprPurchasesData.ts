import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils.js';
import { ActivityType } from 'hooks/useActivity/useActivity';
import { useController } from 'hooks/useController';
import { usePoolTokens } from 'hooks/usePoolTokens';
import { computeWeightedAveragePrices } from 'hooks/useSwapPositionsData/helpers';
import { useMemo } from 'react';

export function usePaprPurchasesData(swaps: ActivityType[] | null) {
  const { paprToken, token0IsUnderlying } = useController();

  const { token0, token1 } = usePoolTokens();

  const purchases = useMemo(() => {
    if (!swaps) return [];
    return swaps.filter(
      (a) => getAddress(a.tokenOut!.id) === getAddress(paprToken.id),
    );
  }, [swaps, paprToken]);

  const { amountPurchased, averagePurchasePrice, averagePurchased } =
    useMemo(() => {
      const amountPurchasedBigNum = purchases.reduce((a, b) => {
        return ethers.BigNumber.from(a).add(b.amountOut!);
      }, ethers.BigNumber.from(0));

      const amountPurchased = parseFloat(
        ethers.utils.formatUnits(amountPurchasedBigNum, paprToken.decimals),
      );

      const averagePurchasePrice = computeWeightedAveragePrices(
        purchases,
        'amountOut',
        'tokenOut',
        token0IsUnderlying,
        token0,
        token1,
      );

      const averagePurchased = amountPurchased * averagePurchasePrice;

      return {
        amountPurchased,
        averagePurchasePrice,
        averagePurchased,
      };
    }, [purchases, paprToken, token0IsUnderlying, token0, token1]);

  return {
    amountPurchased,
    averagePurchasePrice,
    averagePurchased,
  };
}
