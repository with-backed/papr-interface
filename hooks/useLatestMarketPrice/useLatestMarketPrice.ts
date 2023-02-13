import { Token } from '@uniswap/sdk-core';
import { tickToPrice } from '@uniswap/v3-sdk';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useMemo } from 'react';
import {
  PoolByIdDocument,
  PoolByIdQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';

export function useLatestMarketPrice() {
  const { chainId, uniswapSubgraph } = useConfig();
  const { poolAddress, token0IsUnderlying } = useController();
  const [{ data }] = useQuery<PoolByIdQuery>({
    query: PoolByIdDocument,
    variables: { id: poolAddress },
    context: useMemo(
      () => ({
        url: uniswapSubgraph,
      }),
      [uniswapSubgraph],
    ),
  });

  const token0 = useMemo(() => {
    if (!data || !data.pool) {
      return null;
    }
    return new Token(
      chainId,
      data.pool.token0.id,
      parseInt(data.pool.token0.decimals),
    );
  }, [chainId, data]);

  const token1 = useMemo(() => {
    if (!data || !data.pool) {
      return null;
    }
    return new Token(
      chainId,
      data.pool.token1.id,
      parseInt(data.pool.token1.decimals),
    );
  }, [chainId, data]);

  const price = useMemo(() => {
    if (!data || !data.pool || !token0 || !token1) {
      return null;
    }

    const [baseToken, quoteToken] = token0IsUnderlying
      ? [token1, token0]
      : [token0, token1];

    const uniswapPrice = tickToPrice(
      baseToken,
      quoteToken,
      parseInt(data.pool.tick || 0),
    );
    return parseFloat(uniswapPrice.toFixed(4));
  }, [data, token0, token0IsUnderlying, token1]);

  return price;
}
