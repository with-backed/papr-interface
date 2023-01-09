import React, { useMemo } from 'react';
import { ethers } from 'ethers';
import { convertOneScaledValue } from 'lib/controllers';
import styles from './Loans.module.css';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';
import { Tooltip } from 'components/Tooltip';
import { formatPercent } from 'lib/numberFormat';
import { useController } from 'hooks/useController';

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
