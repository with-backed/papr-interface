import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { formatDollars } from 'lib/numberFormat';
import { useMemo } from 'react';
import {
  PoolByIdDocument,
  PoolByIdQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';

export function usePoolStats() {
  const { uniswapSubgraph } = useConfig();
  const { poolAddress } = useController();

  const [{ data, fetching, error }] = useQuery<PoolByIdQuery>({
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
      return 'Loading...';
    }
    if (error || !data?.pool) {
      return '---';
    }

    return formatDollars(data.pool.volumeUSD);
  }, [data, error, fetching]);

  const totalValueLocked = useMemo(() => {
    if (fetching) {
      return 'Loading...';
    }
    if (error || !data?.pool) {
      return '---';
    }

    return formatDollars(data.pool.totalValueLockedUSD);
  }, [data, error, fetching]);

  const fees24h = useMemo(() => {
    if (fetching) {
      return 'Loading...';
    }
    if (error || !data?.pool) {
      return '---';
    }
    const { feeTier, volumeUSD } = data.pool;
    const volumeNum = parseFloat(volumeUSD);
    const feeTierNum = parseInt(feeTier);
    return formatDollars(volumeNum * (feeTierNum / 1000000));
  }, [data, error, fetching]);

  return {
    fees24h,
    totalValueLocked,
    volume24h,
  };
}
