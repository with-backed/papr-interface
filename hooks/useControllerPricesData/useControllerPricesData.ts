import { getAddress } from '@ethersproject/address';
import { BigNumber, ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController/useController';
import { useTarget } from 'hooks/useTarget';
import { useUniswapSwapsByPool } from 'hooks/useUniswapSwapsByPool';
import { ControllerPricesData } from 'lib/controllers/charts';
import { price } from 'lib/controllers/charts/mark';
import { UTCTimestamp } from 'lightweight-charts';
import { useMemo } from 'react';
import {
  TargetUpdatesByControllerDocument,
  TargetUpdatesByControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import {
  PoolByIdDocument,
  PoolByIdQuery,
  SwapsByPoolQuery,
  Token,
} from 'types/generated/graphql/uniswapSubgraph';
import { CombinedError, useQuery } from 'urql';

type ControllerPricesDataReturn =
  | { pricesData: ControllerPricesData; fetching: false; error: null }
  | { pricesData: null; fetching: true; error: null }
  | { pricesData: null; fetching: false; error: CombinedError };

export function useControllerPricesData(): ControllerPricesDataReturn {
  const { uniswapSubgraph } = useConfig();
  const { id, poolAddress, underlying } = useController();
  const newTarget = useTarget();

  const [{ data: poolData, fetching: poolFetching, error: poolError }] =
    useQuery<PoolByIdQuery>({
      query: PoolByIdDocument,
      variables: { id: poolAddress },
      context: useMemo(
        () => ({
          url: uniswapSubgraph,
        }),
        [uniswapSubgraph],
      ),
    });

  const { baseCurrency, quoteCurrency } = useMemo(() => {
    if (!poolData?.pool) {
      return { baseCurrency: null, quoteCurrency: null };
    }
    const { pool } = poolData;
    if (getAddress(underlying.id) == getAddress(pool.token0.id)) {
      return {
        quoteCurrency: pool.token0 as Token,
        baseCurrency: pool.token1 as Token,
      };
    } else {
      return {
        quoteCurrency: pool.token1 as Token,
        baseCurrency: pool.token0 as Token,
      };
    }
  }, [poolData, underlying.id]);

  const underlyingDecimals = useMemo(() => {
    if (!poolData?.pool) {
      return null;
    }
    const { pool } = poolData;
    if (getAddress(underlying.id) == getAddress(poolData.pool.token0.id)) {
      return pool.token0.decimals;
    } else {
      return pool.token1.decimals;
    }
  }, [poolData, underlying]);

  const { data: swapsQuery, fetching: swapsFetching } =
    useUniswapSwapsByPool(poolAddress);

  const [
    {
      data: targetUpdatesData,
      fetching: targetUpdatesFetching,
      error: targetUpdatesError,
    },
  ] = useQuery<TargetUpdatesByControllerQuery>({
    query: TargetUpdatesByControllerDocument,
    variables: { controller: id },
  });

  const markValues = useMemo(() => {
    if (
      !swapsQuery?.swaps ||
      !baseCurrency ||
      !quoteCurrency ||
      !poolData?.pool
    ) {
      return [];
    }
    return marks(
      swapsQuery.swaps,
      baseCurrency,
      quoteCurrency,
      poolData?.pool?.token0 as Token,
    );
  }, [baseCurrency, poolData, quoteCurrency, swapsQuery]);

  const targetValues = useMemo(() => {
    if (!targetUpdatesData?.targetUpdates || !newTarget) {
      return [];
    }
    return targets(
      targetUpdatesData.targetUpdates,
      newTarget,
      underlyingDecimals,
    );
  }, [newTarget, targetUpdatesData, underlyingDecimals]);

  const index = useMemo(() => parseFloat(ethers.utils.formatEther(1)), []);

  if (poolFetching || swapsFetching || targetUpdatesFetching) {
    return {
      pricesData: null,
      fetching: true,
      error: null,
    };
  }

  if (poolError || targetUpdatesError) {
    return {
      pricesData: null,
      fetching: false,
      error: (poolError || targetUpdatesError) as CombinedError,
    };
  }

  return {
    pricesData: { targetValues, markValues, index },
    fetching: false,
    error: null,
  };
}

function targets(
  targetUpdates: TargetUpdatesByControllerQuery['targetUpdates'],
  newTarget: BigNumber,
  underlyingDecimals: ethers.BigNumberish,
) {
  const now = Math.floor(Date.now() / 1000);
  const sortedTargets = [...targetUpdates].sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  // get what target would be if updated at this moment and add to array
  if (sortedTargets.length > 0) {
    sortedTargets.push({
      id: 'filler',
      newTarget,
      timestamp: now,
    });
  }

  const formattedTargets = sortedTargets.map((target) => {
    const t = target.timestamp;
    return {
      value: parseFloat(
        ethers.utils.formatUnits(
          ethers.BigNumber.from(target.newTarget),
          underlyingDecimals,
        ),
      ),
      time: t as UTCTimestamp,
    };
  });
  console.log({ formattedTargets });
  return formattedTargets;
}

/**
 * On one swap there was a tremendous market price which ruins the chart.
 * Let's filter that one out.
 */
const OUTLIER_TIMESTAMP = 1675965383;

function marks(
  swaps: SwapsByPoolQuery['swaps'],
  baseCurrency: Token,
  quoteCurrency: Token,
  token0: Token,
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
    seenTimestamps.add(swap.time);
    result.push(swap);
  });

  return result;
}
