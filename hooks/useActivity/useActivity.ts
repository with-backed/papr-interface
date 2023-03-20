import { useConfig } from 'hooks/useConfig';
import { useMemo } from 'react';
import {
  ActivityByControllerAndAccountDocument,
  ActivityByControllerAndAccountQuery,
  ActivityByControllerAndVaultDocument,
  ActivityByControllerAndVaultQuery,
  ActivityByControllerDocument,
  ActivityByControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

export type ActivityType = ActivityByControllerQuery['activities'][0];

/**
 * hook to fetch activity from subgraph depending on if scoping to account or vault
 * @param controllerId - controller id the activity should be scoped to
 * @param account - optional account the activity should be scoped to
 * @param vault - optional vault (controller <> account <> vault string) the activity should be scoped to
 */
export function useActivity(
  controllerId: string,
  account?: string,
  vault?: string,
) {
  const { paprSubgraph } = useConfig();
  const byAccount = useMemo(() => !!account && !vault, [account, vault]);
  const byVault = useMemo(() => !!vault && !account, [account, vault]);
  const byController = useMemo(
    () => (!account && !vault) || (!byAccount && !byVault),
    [account, vault, byAccount, byVault],
  );

  const [
    { data: activityByControllerData, fetching: activityByControllerFetching },
  ] = useQuery<ActivityByControllerQuery>({
    query: ActivityByControllerDocument,
    variables: { controllerId },
    context: useMemo(
      () => ({
        url: paprSubgraph,
      }),
      [paprSubgraph],
    ),
    pause: !byController,
  });

  const [{ data: activityByAccountData, fetching: activityByAccountFetching }] =
    useQuery<ActivityByControllerAndAccountQuery>({
      query: ActivityByControllerAndAccountDocument,
      variables: { controllerId, account },
      context: useMemo(
        () => ({
          url: paprSubgraph,
        }),
        [paprSubgraph],
      ),
      pause: !byAccount,
    });

  const [{ data: activityByVaultData, fetching: activityByVaultFetching }] =
    useQuery<ActivityByControllerAndVaultQuery>({
      query: ActivityByControllerAndVaultDocument,
      variables: { controllerId, vault },
      context: useMemo(
        () => ({
          url: paprSubgraph,
        }),
        [paprSubgraph],
      ),
      pause: !byVault,
    });

  const { data, fetching } = useMemo(() => {
    if (byController)
      return {
        data: activityByControllerData,
        fetching: activityByControllerFetching,
      };
    else if (byAccount) {
      return {
        data: activityByAccountData,
        fetching: activityByAccountFetching,
      };
    } else if (byVault) {
      return {
        data: activityByVaultData,
        fetching: activityByVaultFetching,
      };
    } else {
      return { data: undefined, fetching: true };
    }
  }, [
    byController,
    activityByControllerData,
    activityByControllerFetching,
    byAccount,
    activityByAccountData,
    activityByAccountFetching,
    byVault,
    activityByVaultData,
    activityByVaultFetching,
  ]);

  return { data, fetching };
}
