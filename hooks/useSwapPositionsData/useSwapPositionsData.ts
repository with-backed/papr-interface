import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { useLPActivity } from 'hooks/useLPActivity';
import { usePaprPurchasesData } from 'hooks/usePaprPurchasesData';
import { usePaprSalesData } from 'hooks/usePaprSalesData';
import { useMemo } from 'react';
import {
  SwapActivityByAccountDocument,
  SwapActivityByAccountQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

export function useSwapPositionsData(
  address: string | undefined,
  startTimestamp: number,
  endTimestamp: number,
) {
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

  const { implicitSwaps } = useLPActivity(
    address,
    startTimestamp,
    endTimestamp,
  );

  // returns users swap activities with pseudo swaps for liquidity positions
  const swapsWithImplicit = useMemo(() => {
    return [...(swapActivityForUserData?.activities || []), ...implicitSwaps];
  }, [swapActivityForUserData, implicitSwaps]);

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
