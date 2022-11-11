import { useConfig } from 'hooks/useConfig';
import { useMemo } from 'react';
import {
  ActivityByControllerDocument,
  ActivityByControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

export function useActivityByController(controllerId: string) {
  const { paprMemeSubgraph } = useConfig();
  const [{ data, fetching }] = useQuery<ActivityByControllerQuery>({
    query: ActivityByControllerDocument,
    variables: { controllerId },
    context: useMemo(
      () => ({
        url: paprMemeSubgraph,
      }),
      [paprMemeSubgraph],
    ),
  });

  return { data, fetching };
}
