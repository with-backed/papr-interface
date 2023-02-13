import { useConfig } from 'hooks/useConfig';
import { useMemo } from 'react';
import {
  SwapsByPoolByAddressDocument,
  SwapsByPoolByAddressQuery,
  SwapsByPoolDocument,
  SwapsByPoolQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';

export function useUniswapSwapsByPool(pool: string, userAddress?: string) {
  const { uniswapSubgraph } = useConfig();
  const queryByAddress = useMemo(() => !!userAddress, [userAddress]);
  const [{ data: nonAddressData, fetching: nonAddressFetching }] =
    useQuery<SwapsByPoolQuery>({
      query: SwapsByPoolDocument,
      variables: { pool },
      pause: queryByAddress,
      context: useMemo(
        () => ({
          url: uniswapSubgraph,
        }),
        [uniswapSubgraph],
      ),
    });

  const [{ data: withAddressData, fetching: withAddressFetching }] =
    useQuery<SwapsByPoolByAddressQuery>({
      query: SwapsByPoolByAddressDocument,
      variables: { pool, userAddress },
      pause: !queryByAddress,
      context: useMemo(
        () => ({
          url: uniswapSubgraph,
        }),
        [uniswapSubgraph],
      ),
    });

  if (queryByAddress) {
    return {
      data: withAddressData,
      fetching: withAddressFetching,
    };
  }

  return { data: nonAddressData, fetching: nonAddressFetching };
}
