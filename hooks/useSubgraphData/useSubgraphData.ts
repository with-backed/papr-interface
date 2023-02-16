import { captureException } from '@sentry/nextjs';
import { useConfig } from 'hooks/useConfig';
import { useEffect, useMemo } from 'react';
import {
  PaprControllerByIdDocument,
  PaprControllerByIdQuery,
} from 'types/generated/graphql/inKindSubgraph';
import {
  PoolByIdDocument,
  PoolByIdQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';

export function useSubgraphData() {
  const { controllerAddress, uniswapPoolAddress, uniswapSubgraph } =
    useConfig();

  const [
    {
      data: controllerQueryData,
      fetching: subgraphControllerFetching,
      error: controllerQueryError,
    },
  ] = useQuery<PaprControllerByIdQuery>({
    query: PaprControllerByIdDocument,
    variables: { id: controllerAddress },
  });

  const [{ data: poolData, fetching: subgraphPoolFetching, error: poolError }] =
    useQuery<PoolByIdQuery>({
      query: PoolByIdDocument,
      variables: { id: uniswapPoolAddress },
      context: useMemo(
        () => ({
          url: uniswapSubgraph,
        }),
        [uniswapSubgraph],
      ),
    });

  useEffect(() => {
    if (controllerQueryError) {
      captureException(controllerQueryError);
    }
  }, [controllerQueryError]);

  useEffect(() => {
    if (poolError) {
      captureException(poolError);
    }
  }, [poolError]);

  return {
    subgraphController: controllerQueryData?.paprController ?? null,
    subgraphControllerFetching,
    subgraphPool: poolData?.pool ?? null,
    subgraphPoolFetching,
  };
}
