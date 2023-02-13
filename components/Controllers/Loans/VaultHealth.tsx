import { Tooltip } from 'components/Tooltip';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { convertOneScaledValue } from 'lib/controllers';
import { formatPercent } from 'lib/numberFormat';
import React, { useMemo } from 'react';
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

  const indicator = useMemo(() => {
    const totalElements = 16;
    // Ratio, but as a number out of totalElements rather than a decimal out of 1
    const numHashes = Math.round(ratio * totalElements);
    const empty = Array(totalElements).fill('░');
    const filled = Array(numHashes).fill('▓');
    return filled.concat(empty).slice(0, totalElements);
  }, [ratio]);

  return (
    <>
      <TooltipReference {...healthTooltip}>
        <div
          className={
            ratio > 0.85 ? styles['indicator-danger'] : styles.indicator
          }>
          {indicator.map((char, i) => (
            <p key={i}>{char}</p>
          ))}
        </div>
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
