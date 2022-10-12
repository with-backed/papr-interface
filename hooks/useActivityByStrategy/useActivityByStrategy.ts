import { useConfig } from 'hooks/useConfig';
import { useMemo } from 'react';
import {
  ActivityByStrategyDocument,
  ActivityByStrategyQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

export function useActivityByStrategy(strategyId: string) {
  const { paprMemeSubgraph } = useConfig();
  const [{ data, fetching }] = useQuery<ActivityByStrategyQuery>({
    query: ActivityByStrategyDocument,
    variables: { strategyId },
    context: useMemo(
      () => ({
        url: paprMemeSubgraph,
      }),
      [paprMemeSubgraph],
    ),
  });

  return { data, fetching };
}
