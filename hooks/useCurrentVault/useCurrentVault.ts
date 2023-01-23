import { PaprController } from 'hooks/useController';
import { useEffect, useMemo, useState } from 'react';
import {
  VaultsByOwnerForControllerDocument,
  VaultsByOwnerForControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

// TODO(adamgobes): remove useCurrentVault and utilize useCurrentVaults everywhere
// the below hook should be considered deprecated, DO NOT USE
export function useCurrentVault(
  controller: PaprController,
  user: string | undefined,
) {
  const [{ data: vaultsData, fetching: vaultFetching }] = useQuery({
    query: VaultsByOwnerForControllerDocument,
    variables: {
      owner: user?.toLowerCase(),
      controller: controller.id.toLowerCase(),
    },
    pause: !user,
  });

  const currentVault = useMemo(() => {
    if (vaultFetching || !vaultsData?.vaults) return null;
    if (vaultsData.vaults.length === 0) return null;

    return vaultsData.vaults[0];
  }, [vaultFetching, vaultsData]);

  return {
    currentVault,
    vaultFetching,
  };
}

export function useCurrentVaults(
  controller: PaprController,
  user: string | undefined,
) {
  const [prevData, setPrevData] = useState<
    VaultsByOwnerForControllerQuery | undefined
  >(undefined);
  const [{ data: vaultsData, fetching: vaultsFetching }, reexecuteQuery] =
    useQuery({
      query: VaultsByOwnerForControllerDocument,
      variables: {
        owner: user?.toLowerCase(),
        controller: controller.id.toLowerCase(),
      },
      pause: !user,
    });

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
