import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { usePoolDayDatas } from 'hooks/usePoolDayDatas';
import { formatDollars, formatPercent } from 'lib/numberFormat';
import { useMemo } from 'react';
import {
  PoolByIdDocument,
  PoolByIdQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';

const LOADING = 'Loading...';
const NO_DATA = '---';

export function usePoolStats() {
  const { uniswapSubgraph } = useConfig();
  const { poolAddress } = useController();
  const { data: poolDayDatas, allFound } = usePoolDayDatas();

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

  const volume24h = useMemo(() => {
    if (fetching) {
      return LOADING;
    }
    if (error || !poolByIdData?.pool) {
      return NO_DATA;
    }

    return formatDollars(poolByIdData.pool.volumeUSD);
  }, [poolByIdData, error, fetching]);

  const fees24h = useMemo(() => {
    if (fetching) {
      return LOADING;
    }
    if (error || !poolByIdData?.pool) {
      return NO_DATA;
    }
    const { feeTier, volumeUSD } = poolByIdData.pool;
    const volumeNum = parseFloat(volumeUSD);
    const feeTierNum = parseInt(feeTier);
    return formatDollars(volumeNum * (feeTierNum / 1000000));
  }, [poolByIdData, error, fetching]);

  const totalVolume = useMemo(() => {
    if (!allFound) {
      return LOADING;
    }

    return formatDollars(
      poolDayDatas.reduce(
        (acc, { volumeUSD }) => acc + parseFloat(volumeUSD),
        0,
      ),
    );
  }, [allFound, poolDayDatas]);

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
