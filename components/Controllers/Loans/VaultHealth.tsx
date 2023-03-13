import { HealthBar } from 'components/HealthBar';
import { Tooltip } from 'components/Tooltip';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useLTV } from 'hooks/useLTV';
import { convertOneScaledValue } from 'lib/controllers';
import { formatPercent } from 'lib/numberFormat';
import React, { useMemo } from 'react';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';
import { SubgraphVault } from 'types/SubgraphVault';

import styles from './Loans.module.css';

type VaultHealthProps = {
  vault: SubgraphVault;
};
export function VaultHealth({ vault }: VaultHealthProps) {
  const healthTooltip = useTooltipState();
  const { maxLTV } = useController();
  const ltv = useLTV(vault?.token.id, vault?.collateralCount, vault.debt);
  const formattedMaxLTV = convertOneScaledValue(
    ethers.BigNumber.from(maxLTV),
    4,
  );
  const ratio = useMemo(
    () => (ltv ? ltv / formattedMaxLTV : 0),
    [formattedMaxLTV, ltv],
  );

  return (
    <>
      <TooltipReference {...healthTooltip}>
        <HealthBar ratio={ratio} />
      </TooltipReference>
      <Tooltip {...healthTooltip}>
        <div className={styles.tooltip}>
          <div>
            <span>Current LTV</span>
            <span>{ltv ? formatPercent(ltv) : '...'}</span>
          </div>
          <div>
            <span>Max LTV</span>
            <span>{formatPercent(formattedMaxLTV)}</span>
          </div>
          <div>
            <span>Current/Max LTV</span>
            <span>{formatPercent(ratio)}</span>
          </div>
        </div>
      </Tooltip>
    </>
  );
}
