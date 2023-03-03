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
        <VaultHealthTooltipContent ltv={ltv} maxLtv={formattedMaxLTV} />
      </Tooltip>
    </>
  );
}

type VaultHealthTooltipContentProps = {
  ltv: number | null;
  maxLtv: number;
  debt: string;
  debtPercentChange: string;
};

function VaultHealthTooltipContent({
  ltv,
  maxLtv,
  debt,
  debtPercentChange,
}: VaultHealthTooltipContentProps) {
  return (
    <div className={styles.tooltip}>
      <span>LTV calculation:</span>
      <span></span>
      <span className={styles.right}>Δ 24hr</span>

      <span>Debt (papr borrowed x Target)</span>
      <span>{debt}</span>
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
