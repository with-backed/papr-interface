import React, { useMemo } from 'react';
import { ethers } from 'ethers';
import { convertOneScaledValue } from 'lib/controllers';
import styles from './Loans.module.css';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';
import { Tooltip } from 'components/Tooltip';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';

type VaultHealthProps = {
  ltv: number;
  maxLtv: ethers.BigNumber;
};
export function VaultHealth({ ltv, maxLtv }: VaultHealthProps) {
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
    <span
      className={ratio > 0.5 ? styles['indicator-danger'] : styles.indicator}>
      {indicator}
    </span>
  );
}

type NewVaultHealthProps = {
  debt: ethers.BigNumber;
  maxDebt: ethers.BigNumber;
};

// TODO(adamgobes): Migrate all old health components to use this new vault health component and rename
export function NewVaultHealth({ debt, maxDebt }: NewVaultHealthProps) {
  const healthTooltip = useTooltipState();
  const ratio = Math.min(
    1,
    parseFloat(ethers.utils.formatEther(debt)) /
      parseFloat(ethers.utils.formatEther(maxDebt)),
  );

  const indicator = useMemo(() => {
    // Ratio, but as a number out of 10 rather than a decimal out of 1
    const numHashes = Math.round(ratio * 10);
    const dashes = Array(10).fill('-');
    const hashes = Array(numHashes).fill('#');
    return hashes.concat(dashes).join('').substring(0, 10);
  }, [ratio]);

  const formattedLoanAmount = useMemo(
    () => formatTokenAmount(parseFloat(ethers.utils.formatEther(debt))),
    [debt],
  );

  const formattedMaxDebt = useMemo(
    () => formatTokenAmount(parseFloat(ethers.utils.formatEther(maxDebt))),
    [maxDebt],
  );

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
            <span>Loan</span>
            <span>${formattedLoanAmount}</span>
          </div>
          <div>
            <span>Max Debt</span>
            <span>${formattedMaxDebt}</span>
          </div>
          <div>
            <span>Current/Max Debt</span>
            <span>{formatPercent(ratio)}</span>
          </div>
        </div>
      </Tooltip>
    </>
  );
}
