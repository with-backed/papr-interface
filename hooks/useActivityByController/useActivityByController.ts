import { useConfig } from 'hooks/useConfig';
import { useMemo } from 'react';
import {
  ActivityByControllerDocument,
  ActivityByControllerQuery,
  ActivityByControllerAndAccountQuery,
  ActivityByControllerAndVaultQuery,
  ActivityByControllerAndVaultDocument,
  ActivityByControllerAndAccountDocument,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

export function useActivity(
  controllerId: string,
  account?: string,
  vault?: string,
) {
  const { paprMemeSubgraph } = useConfig();
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
        url: paprMemeSubgraph,
      }),
      [paprMemeSubgraph],
    ),
    pause: !byController,
  });

  const [{ data: activityByAccountData, fetching: activityByAccountFetching }] =
    useQuery<ActivityByControllerAndAccountQuery>({
      query: ActivityByControllerAndAccountDocument,
      variables: { controllerId, account },
      context: useMemo(
        () => ({
          url: paprMemeSubgraph,
        }),
        [paprMemeSubgraph],
      ),
      pause: !byAccount,
    });

  const [{ data: activityByVaultData, fetching: activityByVaultFetching }] =
    useQuery<ActivityByControllerAndVaultQuery>({
      query: ActivityByControllerAndVaultDocument,
      variables: { controllerId, vault },
      context: useMemo(
        () => ({
          url: paprMemeSubgraph,
        }),
        [paprMemeSubgraph],
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
