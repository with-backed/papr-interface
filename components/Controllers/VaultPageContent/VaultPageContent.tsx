import React, { useMemo } from 'react';
import { PaprController } from 'lib/PaprController';
import controllerStyles from '../Controller.module.css';
import { Collateral } from 'components/Controllers/Collateral';
import { Activity } from 'components/Controllers/Activity';
import { TokenPerformance } from 'components/Controllers/TokenPerformance';
import { ControllerPricesData } from 'lib/controllers/charts';
import { Loans } from 'components/Controllers/Loans';

type VaultPageContentProps = {
  paprController: PaprController;
  vaultId: string;
  pricesData: ControllerPricesData | null;
};

export function VaultPageContent({
  paprController,
  vaultId,
  pricesData,
}: VaultPageContentProps) {
  const vaultIds = useMemo(() => new Set([vaultId]), [vaultId]);
  return (
    <div className={controllerStyles.wrapper}>
      <Loans paprController={paprController} vaultId={vaultId} />
      <Collateral paprController={paprController} vaultId={vaultId} />
      <Activity paprController={paprController} vaultIds={vaultIds} />
      <TokenPerformance
        pricesData={{ [paprController.id]: pricesData }}
        controllers={[paprController]}
      />
    </div>
  );
}
