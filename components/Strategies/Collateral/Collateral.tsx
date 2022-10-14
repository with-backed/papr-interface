import { Fieldset } from 'components/Fieldset';
import { LendingStrategy } from 'lib/LendingStrategy';
import { Asset, useCollection } from '@center-inc/react';
import React, { useMemo } from 'react';
import styles from './Collateral.module.css';
import { useConfig } from '../../../hooks/useConfig';
import { TooltipReference, useTooltipState } from 'reakit';
import { Tooltip } from 'components/Tooltip';
import { useAsyncValue } from '../../../hooks/useAsyncValue';
import { ethers } from 'ethers';
import { computeLtv, convertOneScaledValue } from '../../../lib/strategies';
import { formatPercent } from '../../../lib/numberFormat';

type CollateralProps = {
  lendingStrategy: LendingStrategy;
};

export function Collateral({ lendingStrategy }: CollateralProps) {
  const norm = useAsyncValue(
    () => lendingStrategy.newNorm(),
    [lendingStrategy],
  );
  const collateral = useMemo(
    () =>
      lendingStrategy.vaults?.flatMap((v) =>
        v.collateral.map((c) => ({
          ...c,
          debt: v.debt,
          totalCollateralValue: v.totalCollateralValue,
        })),
      ),
    [lendingStrategy],
  );

  if (!collateral || collateral.length === 0) {
    return (
      <Fieldset legend="🖼 Collateral">
        No collateral associated with this strategy
      </Fieldset>
    );
  }

  return (
    <Fieldset legend="🖼 Collateral">
      <div className={styles.wrapper}>
        {collateral.map((c) => (
          <Tile
            key={c.id}
            address={c.contractAddress}
            tokenId={c.tokenId}
            debt={c.debt}
            totalCollateralValue={c.totalCollateralValue}
            norm={norm}
          />
        ))}
      </div>
    </Fieldset>
  );
}

type TileProps = {
  address: string;
  tokenId: string;
  debt: any;
  totalCollateralValue: any;
  norm: ethers.BigNumber | null;
};
function Tile({
  address,
  tokenId,
  debt,
  totalCollateralValue,
  norm,
}: TileProps) {
  const { centerNetwork } = useConfig();
  const result = useCollection({ network: centerNetwork as any, address });
  const ltv = useMemo(() => {
    if (norm) {
      return formatPercent(
        convertOneScaledValue(computeLtv(debt, totalCollateralValue, norm), 4),
      );
    }
    return '...';
  }, [debt, norm, totalCollateralValue]);
  const tooltip = useTooltipState();
  return (
    <div className={styles.tile}>
      <TooltipReference {...tooltip}>
        <Asset address={address} tokenId={tokenId} preset="small" />
      </TooltipReference>
      <Tooltip {...tooltip}>
        {result?.name} #{tokenId}
        <br />
        LTV: {ltv}
      </Tooltip>
    </div>
  );
}
