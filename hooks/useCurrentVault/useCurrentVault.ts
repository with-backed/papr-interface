import { PaprController } from 'lib/PaprController';
import { useMemo } from 'react';
import {
  CollateralVaultByOwnerForControllerDocument,
  VaultsByOwnerForControllerDocument,
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
  const [{ data: vaultsData, fetching: vaultsFetching }] = useQuery({
    query: VaultsByOwnerForControllerDocument,
    variables: {
      owner: user?.toLowerCase(),
      controller: controller.id.toLowerCase(),
    },
    pause: !user,
  });

  const currentVaults = useMemo(() => {
    if (vaultsFetching || !vaultsData?.vaults) return null;
    if (vaultsData.vaults.length === 0) return null;

    return vaultsData.vaults;
  }, [vaultsFetching, vaultsData]);

  return {
    currentVaults,
    vaultsFetching,
  };
}
