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
import { uniTokenToErc20Token } from 'lib/uniswapSubgraph';
import { useCallback, useMemo } from 'react';
import {
  LpActivityByAccountDocument,
  LpActivityByAccountQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

export function useLPActivityAndImplicitSwaps(
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

  // given a previous activity and the current pool price information returns
  // the deltas of token0 and token1 for the liquidity position since the previous activities' timestamp
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

  // given an LP activity and the LP activity that came right before it (for the same position)
  // populates and returns a new LP activity entity with the amountIn, amountOut, tokenIn, and tokenOut
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

  const latestImplicitSwaps = useMemo(() => {
    if (!poolData) return [];
    const sqrtPricePool = poolData[0];
    const tickCurrent = poolData[1];

    const lpActivitiesByPosition: { [key: string]: ActivityType[] } =
      lpActivities.reduce(
        (acc: { [key: string]: ActivityType[] }, activity) => {
          const positionId = activity.uniswapLiquidityPosition!.id;
          const current = acc[positionId];
          return {
            ...acc,
            [positionId]: current ? [...current, activity] : [activity],
          };
        },
        {},
      );

    return Object.keys(lpActivitiesByPosition).map((positionId) => {
      const latestActivityForPosition = lpActivitiesByPosition[positionId][0];
      if (latestActivityForPosition.cumulativeLiquidity === '0')
        return latestActivityForPosition;
      const psuedoLatestActivity: ActivityType = {
        ...latestActivityForPosition,
        id: `${latestActivityForPosition.id}-psuedo`,
        timestamp: new Date().getTime() / 1000,
        tickCurrent,
        sqrtPricePool,
        liquidityDelta: '0',
        token0Delta: '0',
        token1Delta: '0',
      };
      return transformLPActivityToSwap(
        psuedoLatestActivity,
        latestActivityForPosition,
      );
    });
  }, [lpActivities, poolData, transformLPActivityToSwap]);

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
      .concat(latestImplicitSwaps)
      .filter((a) => !!a.amountIn);
  }, [lpActivities, transformLPActivityToSwap, latestImplicitSwaps]);

  return { lpActivities, implicitSwaps };
}
