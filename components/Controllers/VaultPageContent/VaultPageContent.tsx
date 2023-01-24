import React, { useMemo } from 'react';
import { PaprController_deprecated } from 'lib/PaprController';
import controllerStyles from '../Controller.module.css';
import { Collateral } from 'components/Controllers/Collateral';
import { Activity } from 'components/Controllers/Activity';
import { TokenPerformance } from 'components/Controllers/TokenPerformance';
import { ControllerPricesData } from 'lib/controllers/charts';
import { PoolByIdQuery } from 'types/generated/graphql/uniswapSubgraph';

type VaultPageContentProps = {
  paprController: PaprController_deprecated;
  vaultId: string;
  pricesData: ControllerPricesData | null;
  subgraphPool: NonNullable<PoolByIdQuery['pool']>;
};

export function VaultPageContent({
  paprController,
  vaultId,
  pricesData,
  subgraphPool,
}: VaultPageContentProps) {
  const vaultOwner = useMemo(() => vaultId.split('-')[1], [vaultId]);
  return (
    <div className={controllerStyles.wrapper}>
      <Collateral paprController={paprController} vaultId={vaultId} />
      <Activity account={vaultOwner} subgraphPool={subgraphPool} />
      <TokenPerformance
        pricesData={{ [paprController.id]: pricesData }}
        controllers={[paprController]}
      />
    </div>
  );
}
