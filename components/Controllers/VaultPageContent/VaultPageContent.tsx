import { Activity } from 'components/Controllers/Activity';
import { Collateral } from 'components/Controllers/Collateral';
import { LoanDetails } from 'components/Controllers/Loans/LoanDetails';
import { TokenPerformance } from 'components/Controllers/TokenPerformance';
import { ControllerPricesData } from 'lib/controllers/charts';
import { PaprController } from 'lib/PaprController';
import React, { useMemo } from 'react';

import controllerStyles from '../Controller.module.css';

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
      <LoanDetails vaultId={vaultId} paprController={paprController} />
      <Collateral paprController={paprController} vaultId={vaultId} />
      <Activity paprController={paprController} vaultIds={vaultIds} />
      <TokenPerformance
        pricesData={{ [paprController.id]: pricesData }}
        controllers={[paprController]}
      />
    </div>
  );
}
