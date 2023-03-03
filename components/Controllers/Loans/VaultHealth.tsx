import { HealthBar } from 'components/HealthBar';
import { Tooltip } from 'components/Tooltip';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { convertOneScaledValue } from 'lib/controllers';
import { formatPercent } from 'lib/numberFormat';
import React from 'react';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';

import styles from './Loans.module.css';

type VaultHealthProps = {
  ltv: number;
};
export function VaultHealth({ ltv }: VaultHealthProps) {
  const healthTooltip = useTooltipState();
  const { maxLTV } = useController();
  const formattedMaxLTV = convertOneScaledValue(
    ethers.BigNumber.from(maxLTV),
    4,
  );
  const ratio = ltv / formattedMaxLTV;

  return (
    <>
      <TooltipReference {...healthTooltip}>
        <HealthBar ratio={ratio} />
      </TooltipReference>
      <Tooltip {...healthTooltip}>
        <div className={styles.tooltip}>
          <div>
            <span>Current LTV</span>
            <span>{formatPercent(ltv)}</span>
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
