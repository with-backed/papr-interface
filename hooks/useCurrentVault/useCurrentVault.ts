import { PaprController } from 'lib/PaprController';
import { useMemo } from 'react';
import { VaultsByOwnerForControllerDocument } from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

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
  console.log(controller.id);
  const [{ data: vaultsData, fetching: vaultsFetching }] = useQuery({
    query: VaultsByOwnerForControllerDocument,
    variables: {
      owner: user?.toLowerCase(),
      controller: controller.id.toLowerCase(),
    },
    pause: !user,
  });

  const currentVaults = useMemo(() => {
    console.log({ vaultsData });
    if (vaultsFetching || !vaultsData?.vaults) return null;
    if (vaultsData.vaults.length === 0) return null;

    return vaultsData.vaults;
  }, [vaultsFetching, vaultsData]);

  return {
    currentVaults,
    vaultsFetching,
  };
}
