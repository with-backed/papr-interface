import { useController } from 'hooks/useController';
import { useEffect, useMemo, useState } from 'react';
import {
  VaultsByOwnerForControllerDocument,
  VaultsByOwnerForControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

export function useCurrentVaults(user: string | undefined) {
  const controller = useController();
  const [prevData, setPrevData] = useState<
    VaultsByOwnerForControllerQuery | undefined
  >(undefined);
  const [
    { data: vaultsData, fetching: vaultsFetching, error },
    reexecuteQuery,
  ] = useQuery({
    query: VaultsByOwnerForControllerDocument,
    variables: {
      owner: user?.toLowerCase(),
      controller: controller.id.toLowerCase(),
    },
    pause: !user,
  });

  console.log({ vaultsData, vaultsFetching, error });

  useEffect(() => {
    if (vaultsData) {
      setPrevData(vaultsData);
    }
  }, [vaultsData]);

  const vaultsDataToUse = vaultsData ?? prevData;

  const currentVaults = useMemo(() => {
    if ((vaultsFetching && !prevData) || !vaultsDataToUse?.vaults) return null;
    if (vaultsDataToUse.vaults.length === 0) return null;

    return vaultsDataToUse.vaults;
  }, [prevData, vaultsFetching, vaultsDataToUse]);

  return {
    currentVaults,
    vaultsFetching,
    reexecuteQuery,
  };
}
