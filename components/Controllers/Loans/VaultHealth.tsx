import { HealthBar } from 'components/HealthBar';
import { Tooltip } from 'components/Tooltip';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useLTV } from 'hooks/useLTV';
import { useTarget } from 'hooks/useTarget';
import { convertOneScaledValue } from 'lib/controllers';
import {
  formatPercent,
  formatPercentChange,
  formatTokenAmount,
} from 'lib/numberFormat';
import { percentChange } from 'lib/tokenPerformance';
import React, { useMemo } from 'react';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';
import { SubgraphVault } from 'types/SubgraphVault';

import styles from './Loans.module.css';

type VaultHealthProps = {
  vault: SubgraphVault;
};
export function VaultHealth({ vault }: VaultHealthProps) {
  const healthTooltip = useTooltipState();
  const { maxLTV, paprToken } = useController();
  const ltv = useLTV(vault?.token.id, vault?.collateralCount, vault.debt);
  const formattedMaxLTV = useMemo(
    () => convertOneScaledValue(ethers.BigNumber.from(maxLTV), 4),
    [maxLTV],
  );

  const ratio = useMemo(
    () => (ltv ? ltv / formattedMaxLTV : 0),
    [formattedMaxLTV, ltv],
  );

  const debtNumber = useMemo(
    () => parseFloat(ethers.utils.formatUnits(vault.debt, paprToken.decimals)),
    [paprToken, vault.debt],
  );

  return (
    <>
      <TooltipReference {...healthTooltip}>
        <HealthBar ratio={ratio} />
      </TooltipReference>
      <Tooltip {...healthTooltip}>
        <VaultHealthTooltipContent
          ltv={ltv}
          maxLtv={formattedMaxLTV}
          debt={debtNumber}
        />
      </Tooltip>
    </>
  );
}

type VaultHealthTooltipContentProps = {
  ltv: number | null;
  maxLtv: number;
  debt: number;
};

function VaultHealthTooltipContent({
  ltv,
  maxLtv,
  debt,
}: VaultHealthTooltipContentProps) {
  const { paprToken } = useController();
  const targetNow = useTarget();
  const debtNumberNow = useMemo(() => {
    if (targetNow) {
      const targetNum = parseFloat(
        ethers.utils.formatUnits(targetNow.target, paprToken.decimals),
      );
      return debt * targetNum;
    }
    return null;
  }, [debt, paprToken, targetNow]);

  const targetYesterday = useTarget('yesterday');
  const debtPercentChange = useMemo(() => {
    if (targetYesterday && debtNumberNow) {
      const targetNum = parseFloat(
        ethers.utils.formatUnits(targetYesterday.target, paprToken.decimals),
      );
      const debtNumberYesterday = debt * targetNum;
      return formatPercentChange(
        percentChange(debtNumberYesterday, debtNumberNow),
      );
    }
    return null;
  }, [debt, debtNumberNow, paprToken, targetYesterday]);

  const formattedDebtNow = useMemo(
    () => (debtNumberNow ? formatTokenAmount(debtNumberNow) + ' ETH' : '...'),
    [debtNumberNow],
  );

  return (
    <div className={styles.tooltip}>
      <span>LTV calculation:</span>
      <span></span>
      <span className={styles.right}>Δ 24hr</span>

      <span>Debt (papr borrowed x Target)</span>
      <span>{formattedDebtNow}</span>
      <span>({debtPercentChange})</span>

      <span>Collateral (7-day avg. top bid)</span>
      <span>0.327 ETH</span>
      {/* We don't yet have data to compute percent change for this */}
      <span></span>

      {/* Blank space */}
      <span>
        <br />
      </span>
      <span>
        <br />
      </span>
      <span>
        <br />
      </span>

      <span>This loan&apos;s current LTV is:</span>
      <span>{ltv ? formatPercent(ltv) : '...'}</span>
      <span>(+0.54%)</span>

      <span>Liquidation occurs at Max LTV of</span>
      <span>{formatPercent(maxLtv)}</span>
    </div>
  );
}
