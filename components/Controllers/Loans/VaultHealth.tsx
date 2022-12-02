import React, { useMemo } from 'react';
import { ethers } from 'ethers';
import { convertOneScaledValue } from 'lib/controllers';
import styles from './Loans.module.css';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';
import { Tooltip } from 'components/Tooltip';
import { formatPercent } from 'lib/numberFormat';

type VaultHealthProps = {
  ltv: number;
  maxLtv: ethers.BigNumber;
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
