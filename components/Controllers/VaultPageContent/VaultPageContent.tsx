import { Activity } from 'components/Controllers/Activity';
import { Collateral } from 'components/Controllers/Collateral';
import { TokenPerformance } from 'components/Controllers/TokenPerformance';
import React, { useMemo } from 'react';

import controllerStyles from '../Controller.module.css';

type VaultPageContentProps = {
  vaultId: string;
};

export function VaultPageContent({ vaultId }: VaultPageContentProps) {
  const vaultOwner = useMemo(() => vaultId.split('-')[1], [vaultId]);
  return (
    <div className={controllerStyles.wrapper}>
      <Collateral vaultId={vaultId} />
      <Activity account={vaultOwner} />
      <TokenPerformance />
    </div>
  );
}
