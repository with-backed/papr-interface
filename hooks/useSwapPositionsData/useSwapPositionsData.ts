import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils.js';
import { ActivityType } from 'hooks/useActivity/useActivity';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { price } from 'lib/controllers/charts/mark';
import { computeDeltasFromActivity } from 'lib/controllers/uniswap';
import { erc20TokenToToken, uniTokenToErc20Token } from 'lib/uniswapSubgraph';
import { useMemo } from 'react';
import {
  LpActivityByAccountDocument,
  LpActivityByAccountQuery,
  SwapActivityByAccountDocument,
  SwapActivityByAccountQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

export function useSwapPositionsData(
  address: string | undefined,
  startTimestamp: number,
  endTimestamp: number,
) {
  const { chainId } = useConfig();
  const { paprToken, token0IsUnderlying, underlying } = useController();
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

  const { token0, token1 } = useMemo(() => {
    if (token0IsUnderlying)
      return {
        token0: erc20TokenToToken(underlying, chainId),
        token1: erc20TokenToToken(paprToken, chainId),
      };
    else
      return {
        token0: erc20TokenToToken(paprToken, chainId),
        token1: erc20TokenToToken(underlying, chainId),
      };
  }, [token0IsUnderlying, underlying, paprToken, chainId]);

  // returns users swap activities with pseudo swaps for liquidity positions
  const swapsWithImplicit = useMemo(() => {
    if (
      !swapActivityForUserData?.activities ||
      !lpActivityForUserData?.activities
    )
      return null;

    const implicitSwaps: ActivityType[] = lpActivityForUserData.activities
      .map((a) => {
        const [amount0Delta, amount1Delta] = computeDeltasFromActivity(
          a,
          token0IsUnderlying,
          paprToken,
          underlying,
          chainId,
        );
        if (
          checkZero(amount0Delta, token0.decimals) ||
          checkZero(amount1Delta, token1.decimals)
        )
          return a;
        return {
          ...a,
          amountIn: amount0Delta.isNegative()
            ? amount0Delta.abs()
            : amount1Delta,
          amountOut: amount0Delta.isNegative()
            ? amount1Delta
            : amount0Delta.abs(),
          tokenIn: amount0Delta.isNegative()
            ? uniTokenToErc20Token(token0)
            : uniTokenToErc20Token(token1),
          tokenOut: amount0Delta.isNegative()
            ? uniTokenToErc20Token(token1)
            : uniTokenToErc20Token(token0),
        };
      })
      .filter((a) => !!a.amountIn);
    return [
      ...swapActivityForUserData.activities.filter((a) => !!a.amountIn),
      ...implicitSwaps,
    ];
  }, [
    swapActivityForUserData,
    lpActivityForUserData,
    token0IsUnderlying,
    paprToken,
    underlying,
    chainId,
    token0,
    token1,
  ]);

  const {
    amountPurchased,
    amountSold,
    averageSalePrice,
    averagePurchasePrice,
    averagePurchased,
    averageSold,
    netPapr,
    exitValue,
    magicNumber,
  } = useMemo(() => {
    if (!swapsWithImplicit || swapsWithImplicit.length === 0)
      return {
        amountPurchased: 0,
        amountSold: 0,
        averageSalePrice: 0,
        averagePurchasePrice: 0,
        averagePurchased: 0,
        averageSold: 0,
        netPapr: 0,
        exitValue: 0,
        magicNumber: 0,
      };

    const sales = swapsWithImplicit.filter(
      (a) => getAddress(a.tokenIn!.id) === getAddress(paprToken.id),
    );
    const amountSold = sales.reduce((a, b) => {
      return ethers.BigNumber.from(a).add(b.amountIn!);
    }, ethers.BigNumber.from(0));
    const amountSoldNum = parseFloat(
      ethers.utils.formatUnits(amountSold, paprToken.decimals),
    );

    const averageSalePrice = computeWeightedAveragePrices(
      sales,
      'amountIn',
      'tokenIn',
      token0IsUnderlying,
      token0,
      token1,
    );

    const purchases = swapsWithImplicit.filter(
      (a) => getAddress(a.tokenOut!.id) === getAddress(paprToken.id),
    );
    const amountPurchased = purchases.reduce((a, b) => {
      return ethers.BigNumber.from(a).add(b.amountOut!);
    }, ethers.BigNumber.from(0));
    const amountPurchasedNum = parseFloat(
      ethers.utils.formatUnits(amountPurchased, paprToken.decimals),
    );
    const averagePurchasePrice = computeWeightedAveragePrices(
      purchases,
      'amountOut',
      'tokenOut',
      token0IsUnderlying,
      token0,
      token1,
    );

    const averagePurchased = amountPurchasedNum * averagePurchasePrice;
    const averageSold = amountSoldNum * averageSalePrice;

    const exitValue = (amountPurchasedNum - amountSoldNum) * (price || 0);

    return {
      amountPurchased: amountPurchasedNum,
      amountSold: amountSoldNum,
      averageSalePrice,
      averagePurchasePrice,
      averagePurchased,
      averageSold,
      netPapr: amountPurchasedNum - amountSoldNum,
      exitValue,
      magicNumber: exitValue - averagePurchased,
    };
  }, [swapsWithImplicit, paprToken, token0IsUnderlying, token0, token1, price]);

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
  };
}

function computeWeightedAveragePrices(
  swapActivities: SwapActivityByAccountQuery['activities'],
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
