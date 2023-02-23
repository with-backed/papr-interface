import { getAddress } from '@ethersproject/address';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController/useController';
import { useTarget } from 'hooks/useTarget';
import { useUniswapSwapsByPool } from 'hooks/useUniswapSwapsByPool';
import { ControllerPricesData } from 'lib/controllers/charts';
import { marks } from 'lib/controllers/charts/mark';
import { targets } from 'lib/controllers/charts/target';
import { useMemo } from 'react';
import {
  TargetUpdatesByControllerDocument,
  TargetUpdatesByControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import {
  PoolByIdDocument,
  PoolByIdQuery,
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

  if (poolFetching || swapsFetching || targetUpdatesFetching || !newTarget) {
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
