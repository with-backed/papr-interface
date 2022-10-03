import { LendingStrategy } from 'lib/LendingStrategy';
import { useMemo } from 'react';
import { VaultsByOwnerForStrategyDocument } from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

export function useCurrentVault(
  strategy: LendingStrategy,
  user: string | undefined,
) {
  const [{ data: vaultsData, fetching: vaultFetching }] = useQuery({
    query: VaultsByOwnerForStrategyDocument,
    variables: {
      owner: user?.toLowerCase(),
      strategy: strategy.id.toLowerCase(),
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
