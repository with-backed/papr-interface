import React, { useMemo } from 'react';
import controllerStyles from '../Controller.module.css';
import { Collateral } from 'components/Controllers/Collateral';
import { Activity } from 'components/Controllers/Activity';
import { TokenPerformance } from 'components/Controllers/TokenPerformance';
import { PoolByIdQuery } from 'types/generated/graphql/uniswapSubgraph';

type VaultPageContentProps = {
  vaultId: string;
  subgraphPool: NonNullable<PoolByIdQuery['pool']>;
};

export function VaultPageContent({
  vaultId,
  subgraphPool,
}: VaultPageContentProps) {
  const vaultOwner = useMemo(() => vaultId.split('-')[1], [vaultId]);
  return (
    <div className={controllerStyles.wrapper}>
      <Collateral vaultId={vaultId} />
      <Activity account={vaultOwner} subgraphPool={subgraphPool} />
      <TokenPerformance />
    </div>
  );
}
