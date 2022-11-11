import React from 'react';
import { PaprController } from 'lib/PaprController';
import { LoanDetails } from 'components/Controllers/Loans/LoanDetails';
import controllerStyles from '../Controller.module.css';
import { Collateral } from 'components/Controllers/Collateral';
import { Activity } from 'components/Controllers/Activity';
import { TokenPerformance } from 'components/Controllers/TokenPerformance';
import { ControllerPricesData } from 'lib/controllers/charts';

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
  return (
    <div className={controllerStyles.wrapper}>
      <LoanDetails vaultId={vaultId} paprController={paprController} />
      <Collateral paprController={paprController} vaultId={vaultId} />
      <Activity paprController={paprController} vaultId={vaultId} />
      <TokenPerformance
        pricesData={{ [paprController.id]: pricesData }}
        strategies={[paprController]}
      />
    </div>
  );
}
