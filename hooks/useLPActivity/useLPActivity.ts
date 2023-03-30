import { CurrencyAmount, Price } from '@uniswap/sdk-core';
import { priceToClosestTick, TickMath } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import { ActivityType } from 'hooks/useActivity/useActivity';
import { usePoolTokens } from 'hooks/usePoolTokens';
import { useSlot0 } from 'hooks/useSlot0';
import { checkZero } from 'hooks/useSwapPositionsData/helpers';
import {
  getAmount0FromLPStats,
  getAmount1FromLPStats,
} from 'lib/controllers/uniswap';
import { formatBigNum } from 'lib/numberFormat';
import { uniTokenToErc20Token } from 'lib/uniswapSubgraph';
import { useCallback, useMemo } from 'react';
import {
  LpActivityByAccountDocument,
  LpActivityByAccountQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

export function useLPActivity(
  address: string | undefined,
  startTimestamp: number,
  endTimestamp: number,
) {
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

  const { poolData } = useSlot0();

  const lpActivities = useMemo(() => {
    if (!lpActivityForUserData?.activities) return [];
    return lpActivityForUserData.activities;
  }, [lpActivityForUserData]);

  const computeDeltasFromActivities = useCallback(
    (
      prevActivity: ActivityType,
      tickCurrent: number,
      sqrtPriceCurrent: ethers.BigNumber,
    ) => {
      const [tickLower, tickUpper] = [
        prevActivity.uniswapLiquidityPosition!.tickLower,
        prevActivity.uniswapLiquidityPosition!.tickUpper,
      ];

      const prevAmount0 = getAmount0FromLPStats(
        token0,
        ethers.BigNumber.from(prevActivity.sqrtPricePool!),
        prevActivity.tickCurrent!,
        tickLower,
        tickUpper,
        ethers.BigNumber.from(prevActivity.cumulativeLiquidity!),
      );
      const prevAmount1 = getAmount1FromLPStats(
        token1,
        ethers.BigNumber.from(prevActivity.sqrtPricePool!),
        prevActivity.tickCurrent!,
        tickLower,
        tickUpper,
        ethers.BigNumber.from(prevActivity.cumulativeLiquidity!),
      );

      const currentAmount0 = getAmount0FromLPStats(
        token0,
        sqrtPriceCurrent,
        tickCurrent,
        tickLower,
        tickUpper,
        ethers.BigNumber.from(prevActivity.cumulativeLiquidity!),
      );
      const currentAmount1 = getAmount1FromLPStats(
        token1,
        sqrtPriceCurrent,
        tickCurrent,
        tickLower,
        tickUpper,
        ethers.BigNumber.from(prevActivity.cumulativeLiquidity!),
      );

      return [currentAmount0.sub(prevAmount0), currentAmount1.sub(prevAmount1)];
    },
    [token0, token1],
  );

  const transformLPActivityToSwap = useCallback(
    (activity: ActivityType, prevActivity: ActivityType) => {
      const [amount0Delta, amount1Delta] = computeDeltasFromActivities(
        prevActivity,
        activity.tickCurrent!,
        activity.sqrtPricePool!,
      );
      if (
        checkZero(amount0Delta, token0.decimals) ||
        checkZero(amount1Delta, token1.decimals)
      )
        return activity;

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
        ...activity,
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
    },
    [computeDeltasFromActivities, token0, token1],
  );

  const latestImplicitSwap = useMemo(() => {
    const latestActivity = lpActivities[lpActivities.length - 1];
    if (!poolData || !latestActivity) return latestActivity;
    const sqrtPricePool = poolData[0];
    const tickCurrent = poolData[1];

    const psuedoLatestActivity: ActivityType = {
      ...latestActivity,
      id: `${latestActivity.id}-psuedo`,
      timestamp: new Date().getTime() / 1000,
      tickCurrent,
      sqrtPricePool,
      liquidityDelta: '0',
      token0Delta: '0',
      token1Delta: '0',
    };
    return transformLPActivityToSwap(psuedoLatestActivity, latestActivity);
  }, [lpActivities, poolData, transformLPActivityToSwap]);

  // returns pseudo swaps for liquidity positions
  const implicitSwaps = useMemo(() => {
    if (lpActivities.length === 0) return [];

    return lpActivities
      .map((activity) => {
        const prevActivity = lpActivities.find(
          (a) =>
            a.uniswapLiquidityPosition!.id ===
              activity.uniswapLiquidityPosition!.id &&
            a.timestamp < activity.timestamp,
        );
        if (!prevActivity) return activity;

        return transformLPActivityToSwap(activity, prevActivity);
      })
      .concat([latestImplicitSwap])
      .filter((a) => !!a.amountIn);
  }, [lpActivities, transformLPActivityToSwap, latestImplicitSwap]);

  console.log({
    implicitSwaps: implicitSwaps.map((a) => ({
      amountIn: formatBigNum(a.amountIn!, a.tokenIn!.decimals),
      amountOut: formatBigNum(a.amountOut!, a.tokenOut!.decimals),
      tokenIn: a.tokenIn!.symbol,
      tokenOut: a.tokenOut!.symbol,
    })),
  });

  return { lpActivities, implicitSwaps };
}
