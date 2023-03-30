import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils.js';
import { ActivityType } from 'hooks/useActivity/useActivity';
import { useController } from 'hooks/useController';
import { usePoolTokens } from 'hooks/usePoolTokens';
import { computeWeightedAveragePrices } from 'hooks/useSwapPositionsData/helpers';
import { useMemo } from 'react';

export type SalesData = {
  amountSold: number;
  averageSalePrice: number;
};

export function usePaprSalesData(swaps: ActivityType[] | null) {
  const { paprToken, token0IsUnderlying } = useController();

  const { token0, token1 } = usePoolTokens();

  const sales = useMemo(() => {
    if (!swaps) return [];
    return swaps.filter(
      (a) => getAddress(a.tokenIn!.id) === getAddress(paprToken.id),
    );
  }, [swaps, paprToken]);

  const { amountSold, averageSalePrice, averageSold } = useMemo(() => {
    const amountSoldBigNum = sales.reduce((a, b) => {
      return ethers.BigNumber.from(a).add(b.amountIn!);
    }, ethers.BigNumber.from(0));

    const amountSold = parseFloat(
      ethers.utils.formatUnits(amountSoldBigNum, paprToken.decimals),
    );

    const averageSalePrice = computeWeightedAveragePrices(
      sales,
      'amountIn',
      'tokenIn',
      token0IsUnderlying,
      token0,
      token1,
    );

    const averageSold = amountSold * averageSalePrice;

    return {
      amountSold,
      averageSalePrice,
      averageSold,
    };
  }, [sales, paprToken, token0IsUnderlying, token0, token1]);

  return {
    amountSold,
    averageSalePrice,
    averageSold,
  };
}
