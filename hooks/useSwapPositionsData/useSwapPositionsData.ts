import { ActivityType } from 'hooks/useActivity/useActivity';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { usePaprPurchasesData } from 'hooks/usePaprPurchasesData';
import { usePaprSalesData } from 'hooks/usePaprSalesData';
import { usePoolTokens } from 'hooks/usePoolTokens';
import { useMemo } from 'react';
import {
  LpActivityByAccountDocument,
  LpActivityByAccountQuery,
  SwapActivityByAccountDocument,
  SwapActivityByAccountQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

import { transformLPActivityToSwap } from './helpers';

export function useSwapPositionsData(
  address: string | undefined,
  startTimestamp: number,
  endTimestamp: number,
) {
  const { chainId } = useConfig();
  const controller = useController();
  const price = useLatestMarketPrice();

  const [{ data: swapActivityForUserData }] =
    useQuery<SwapActivityByAccountQuery>({
      query: SwapActivityByAccountDocument,
      variables: {
        account: address?.toLowerCase(),
        startTimestamp: startTimestamp,
        endTimestamp: endTimestamp,
      },
      pause: !address,
    });

  const [{ data: lpActivityForUserData }] = useQuery<LpActivityByAccountQuery>({
    query: LpActivityByAccountDocument,
    variables: {
      account: address?.toLowerCase(),
      startTimestamp: startTimestamp,
      endTimestamp: endTimestamp,
    },
    pause: !address,
  });

  const { token0, token1 } = usePoolTokens();

  // returns users swap activities with pseudo swaps for liquidity positions
  const swapsWithImplicit = useMemo(() => {
    if (
      !swapActivityForUserData?.activities ||
      !lpActivityForUserData?.activities
    )
      return null;

    const implicitSwaps: ActivityType[] = lpActivityForUserData.activities
      .map((activity) => {
        const prevActivity = lpActivityForUserData.activities.find(
          (a) =>
            a.uniswapLiquidityPosition!.id ===
              activity.uniswapLiquidityPosition!.id &&
            a.timestamp < activity.timestamp,
        );

        return transformLPActivityToSwap(
          activity,
          prevActivity,
          controller,
          token0,
          token1,
          chainId,
        );
      })
      .filter((a) => !!a.amountIn);
    return [
      ...swapActivityForUserData.activities.filter((a) => !!a.amountIn),
      ...implicitSwaps,
    ];
  }, [
    swapActivityForUserData,
    lpActivityForUserData,
    controller,
    chainId,
    token0,
    token1,
  ]);

  const { amountSold, averageSalePrice, averageSold } =
    usePaprSalesData(swapsWithImplicit);

  const { amountPurchased, averagePurchasePrice, averagePurchased } =
    usePaprPurchasesData(swapsWithImplicit);

  const { netPapr, exitValue, magicNumber } = useMemo(() => {
    const exitValue = (amountPurchased - amountSold) * (price || 0);

    return {
      netPapr: amountPurchased - amountSold,
      exitValue,
      magicNumber: exitValue - averagePurchased,
    };
  }, [amountPurchased, amountSold, averagePurchased, price]);

  return {
    amountPurchased,
    amountSold,
    averageSalePrice,
    averagePurchasePrice,
    averagePurchased,
    averageSold,
    netPapr,
    exitValue,
    magicNumber,
    swapsWithImplicit,
  };
}
