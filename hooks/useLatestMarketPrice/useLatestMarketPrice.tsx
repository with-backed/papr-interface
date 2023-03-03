import { Token } from '@uniswap/sdk-core';
import { tickToPrice } from '@uniswap/v3-sdk';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { createContext, useContext, useEffect, useMemo } from 'react';
import {
  PoolByIdDocument,
  PoolByIdQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';

const MarketPriceContext = createContext<number | null>(null);

export const MarketPriceProvider: React.FunctionComponent = ({ children }) => {
  const { chainId, uniswapSubgraph } = useConfig();
  const { poolAddress, token0IsUnderlying } = useController();
  const [{ data }, reExecuteQuery] = useQuery<PoolByIdQuery>({
    query: PoolByIdDocument,
    variables: { id: poolAddress },
    context: useMemo(
      () => ({
        url: uniswapSubgraph,
      }),
      [uniswapSubgraph],
    ),
  });

  useEffect(() => {
    const id = setInterval(
      () => reExecuteQuery({ requestPolicy: 'network-only' }),
      100 * 60 * 2,
    );
    return () => clearInterval(id);
  }, [reExecuteQuery]);

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

  return (
    <MarketPriceContext.Provider value={price}>
      {children}
    </MarketPriceContext.Provider>
  );
};

export function useLatestMarketPrice() {
  const value = useContext(MarketPriceContext);
  return value;
}
