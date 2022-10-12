import { useConfig } from 'hooks/useConfig';
import { useMemo } from 'react';
import {
  SwapsByPoolDocument,
  SwapsByPoolQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';

export function useUniswapSwapsByPool(pool: string) {
  const { uniswapSubgraph } = useConfig();
  const [{ data, fetching }] = useQuery<SwapsByPoolQuery>({
    query: SwapsByPoolDocument,
    variables: { pool },
    context: useMemo(
      () => ({
        url: uniswapSubgraph,
      }),
      [uniswapSubgraph],
    ),
  });

  return { data, fetching };
}
