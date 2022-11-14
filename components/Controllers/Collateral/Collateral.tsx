import { Fieldset } from 'components/Fieldset';
import { PaprController } from 'lib/PaprController';
import { useCollection } from '@center-inc/react';
import React, { useMemo } from 'react';
import styles from './Collateral.module.css';
import { useConfig } from 'hooks/useConfig';
import { TooltipReference, useTooltipState } from 'reakit';
import { Tooltip } from 'components/Tooltip';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { ethers } from 'ethers';
import { computeLtv, convertOneScaledValue } from 'lib/controllers';
import { formatPercent } from 'lib/numberFormat';
import { CenterAsset } from 'components/CenterAsset';

type CollateralProps = {
  paprController: PaprController;
  // If scoping collateral view to just a specific vault
  // instead of the whole controller
  vaultId?: string;
};

export function Collateral({ paprController, vaultId }: CollateralProps) {
  const norm = useAsyncValue(
    () => paprController.newTarget(),
    [paprController],
  );
  const collateral = useMemo(() => {
    if (vaultId) {
      const vault = paprController.vaults?.find((v) => v.id === vaultId);
      return vault?.collateral.map((c) => ({
        ...c,
        debt: vault.debt,
      }));
    }
    return paprController.vaults?.flatMap((v) =>
      v.collateral.map((c) => ({
        ...c,
        debt: v.debt,
      })),
    );
  }, [paprController, vaultId]);

  if (!collateral || collateral.length === 0) {
    return (
      <Fieldset legend="🖼 Collateral">
        No collateral associated with this controller
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
            // TODO punting this for the vault rework
            totalCollateralValue={0}
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
        <CenterAsset address={address} tokenId={tokenId} preset="small" />
      </TooltipReference>
      <Tooltip {...tooltip}>
        {result?.name} #{tokenId}
        <br />
        LTV: {ltv}
      </Tooltip>
    </div>
  );
}
