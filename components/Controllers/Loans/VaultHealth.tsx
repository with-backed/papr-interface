import { Tooltip } from 'components/Tooltip';
import { convertOneScaledValue } from 'lib/controllers';
import { formatPercent } from 'lib/numberFormat';
import React, { useMemo } from 'react';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';

import styles from './Loans.module.css';

type VaultHealthProps = {
  ltv: number;
  maxLtv: BigNumber;
};
export function VaultHealth({ ltv, maxLtv }: VaultHealthProps) {
  const healthTooltip = useTooltipState();
  const maxLTV = convertOneScaledValue(maxLtv, 4);
  const ratio = ltv / maxLTV;

  const indicator = useMemo(() => {
    // Ratio, but as a number out of 10 rather than a decimal out of 1
    const numHashes = Math.round(ratio * 10);
    const dashes = Array(10).fill('-');
    const hashes = Array(numHashes).fill('#');
    return hashes.concat(dashes).join('').substring(0, 10);
  }, [ratio]);

  return (
    <>
      <TooltipReference {...healthTooltip}>
        <span
          className={
            ratio > 0.5 ? styles['indicator-danger'] : styles.indicator
          }>
          {indicator}
        </span>
      </TooltipReference>
      <Tooltip {...healthTooltip}>
        <div className={styles.tooltip}>
          <div>
            <span>Current LTV</span>
            <span>{formatPercent(ltv)}</span>
          </div>
          <div>
            <span>Max LTV</span>
            <span>{formatPercent(maxLTV)}</span>
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
