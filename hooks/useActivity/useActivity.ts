import { useConfig } from 'hooks/useConfig';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  limit = 5,
) {
  const { paprSubgraph } = useConfig();
  const byAccount = useMemo(() => !!account && !vault, [account, vault]);
  const byVault = useMemo(() => !!vault && !account, [account, vault]);
  const byController = useMemo(
    () => (!account && !vault) || (!byAccount && !byVault),
    [account, vault, byAccount, byVault],
  );
  const [page, setPage] = useState<number>(1);

  const [byAccountData, setByAccountData] = useState<ActivityType[]>([]);
  const [byVaultData, setByVaultData] = useState<ActivityType[]>([]);
  const [byControllerData, setByControllerData] = useState<ActivityType[]>([]);

  const [
    { data: activityByControllerData, fetching: activityByControllerFetching },
  ] = useQuery<ActivityByControllerQuery>({
    query: ActivityByControllerDocument,
    variables: { controllerId, limit, skip: limit * (page - 1) },
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
      variables: { controllerId, account, limit, skip: limit * (page - 1) },
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
      variables: { controllerId, vault, limit, skip: limit * (page - 1) },
      context: useMemo(
        () => ({
          url: paprSubgraph,
        }),
        [paprSubgraph],
      ),
      pause: !byVault,
    });

  useEffect(() => {
    if (byAccount) {
      setByAccountData((prev) => {
        if (activityByAccountData?.activities) {
          return [...prev, ...activityByAccountData.activities];
        } else {
          return prev;
        }
      });
    } else if (byVault) {
      setByVaultData((prev) => {
        if (activityByVaultData?.activities) {
          return [...prev, ...activityByVaultData.activities];
        } else {
          return prev;
        }
      });
    } else if (byController) {
      setByControllerData((prev) => {
        if (activityByControllerData?.activities) {
          return [...prev, ...activityByControllerData.activities];
        } else {
          return prev;
        }
      });
    }
  }, [
    activityByControllerData,
    activityByAccountData,
    activityByVaultData,
    byAccount,
    byController,
    byVault,
  ]);

  const { data, fetching } = useMemo(() => {
    if (byController)
      return {
        data: byControllerData,
        fetching: activityByControllerFetching,
      };
    else if (byAccount) {
      return {
        data: byAccountData,
        fetching: activityByAccountFetching,
      };
    } else if (byVault) {
      return {
        data: byVaultData,
        fetching: activityByVaultFetching,
      };
    } else {
      return { data: [], fetching: true };
    }
  }, [
    byController,
    byControllerData,
    activityByControllerFetching,
    byAccount,
    byAccountData,
    activityByAccountFetching,
    byVault,
    byVaultData,
    activityByVaultFetching,
  ]);

  const fetchMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, [setPage]);

  return { data, fetchMore, fetching };
}
