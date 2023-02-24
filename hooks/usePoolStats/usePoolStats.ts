import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { BLOCKS_IN_A_DAY } from 'lib/constants';
import { formatDollars, formatPercent } from 'lib/numberFormat';
import { useMemo } from 'react';
import {
  PoolByIdByBlockDocument,
  PoolByIdByBlockQuery,
  PoolByIdDocument,
  PoolByIdQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';
import { useBlockNumber } from 'wagmi';

const LOADING = 'Loading...';
const NO_DATA = '---';

// We don't want to refresh the pool data on every block number
const BLOCK_NUMBER_CACHE_TIME = 1000 * 60 * 60;

export function usePoolStats() {
  const blockNumber = useBlockNumber({ cacheTime: BLOCK_NUMBER_CACHE_TIME });
  const { uniswapSubgraph } = useConfig();
  const { poolAddress } = useController();

  const [{ data: poolByIdData, fetching, error }] = useQuery<PoolByIdQuery>({
    query: PoolByIdDocument,
    variables: { id: poolAddress },
    context: useMemo(
      () => ({
        url: uniswapSubgraph,
      }),
      [uniswapSubgraph],
    ),
  });

  const [
    {
      data: poolByIdYesterdayData,
      fetching: poolByIdYesterdayFetching,
      error: poolByIdYesterdayError,
    },
  ] = useQuery<PoolByIdByBlockQuery>({
    query: PoolByIdByBlockDocument,
    variables: {
      id: poolAddress,
      blockHeight: blockNumber?.data ? blockNumber.data - BLOCKS_IN_A_DAY : 0,
    },
    pause: !blockNumber,
    context: useMemo(
      () => ({
        url: uniswapSubgraph,
      }),
      [uniswapSubgraph],
    ),
  });

  const volume24h = useMemo(() => {
    if (fetching || poolByIdYesterdayFetching) {
      return LOADING;
    }
    if (
      error ||
      !poolByIdData?.pool ||
      poolByIdYesterdayError ||
      !poolByIdYesterdayData?.pool
    ) {
      return NO_DATA;
    }

    const { volumeUSD } = poolByIdData.pool;
    const { volumeUSD: volumeUSDYesterday } = poolByIdYesterdayData.pool;

    return formatDollars(
      parseFloat(volumeUSD) - parseFloat(volumeUSDYesterday),
    );
  }, [
    error,
    fetching,
    poolByIdData,
    poolByIdYesterdayData,
    poolByIdYesterdayError,
    poolByIdYesterdayFetching,
  ]);

  const fees24h = useMemo(() => {
    if (fetching || poolByIdYesterdayFetching) {
      return LOADING;
    }
    if (
      error ||
      !poolByIdData?.pool ||
      poolByIdYesterdayError ||
      !poolByIdYesterdayData?.pool
    ) {
      return NO_DATA;
    }

    const { feesUSD } = poolByIdData.pool;
    const { feesUSD: feesUSDYesterday } = poolByIdYesterdayData.pool;

    return formatDollars(parseFloat(feesUSD) - parseFloat(feesUSDYesterday));
  }, [
    error,
    fetching,
    poolByIdData,
    poolByIdYesterdayData,
    poolByIdYesterdayError,
    poolByIdYesterdayFetching,
  ]);

  const totalVolume = useMemo(() => {
    if (fetching) {
      return LOADING;
    }
    if (error || !poolByIdData?.pool) {
      return NO_DATA;
    }

    return formatDollars(poolByIdData.pool.volumeUSD);
  }, [error, fetching, poolByIdData]);

  const feeTier = useMemo(() => {
    if (fetching) {
      return LOADING;
    }
    if (error || !poolByIdData?.pool) {
      return NO_DATA;
    }

    const { feeTier } = poolByIdData.pool;
    return formatPercent(feeTier / 1000000);
  }, [error, fetching, poolByIdData]);

  const totalValueLocked = useMemo(() => {
    if (fetching) {
      return LOADING;
    }
    if (error || !poolByIdData?.pool) {
      return NO_DATA;
    }
    const { totalValueLockedUSD } = poolByIdData.pool;
    return formatDollars(totalValueLockedUSD);
  }, [error, fetching, poolByIdData]);

  return {
    fees24h,
    volume24h,
    totalVolume,
    feeTier,
    fetching,
    totalValueLocked,
  };
}
