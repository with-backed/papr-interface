import { Fieldset } from 'components/Fieldset';
import { PaprController } from 'lib/PaprController';
import { useCollection } from '@center-inc/react';
import React, { useMemo } from 'react';
import styles from './Collateral.module.css';
import { useConfig } from 'hooks/useConfig';
import { TooltipReference, useTooltipState } from 'reakit';
import { Tooltip } from 'components/Tooltip';
import { ethers } from 'ethers';
import { formatPercent } from 'lib/numberFormat';
import { CenterAsset } from 'components/CenterAsset';
import { computeLTVFromDebts } from 'lib/controllers';
import { useShowMore } from 'hooks/useShowMore';
import { TextButton } from 'components/Button';
import { useMaxDebt } from 'hooks/useMaxDebt';

type CollateralProps = {
  paprController: PaprController;
  // If scoping collateral view to just a specific vault
  // instead of the whole controller
  vaultId?: string;
};

const COLLATERAL_INCREMENT = 30;

export function Collateral({ paprController, vaultId }: CollateralProps) {
  const vaults = useMemo(() => {
    if (vaultId) {
      const vault = paprController.vaults?.find((v) => v.id === vaultId);
      return vault ? [vault] : [];
    }
    return paprController.vaults || [];
  }, [paprController, vaultId]);

  const collateral = useMemo(
    () =>
      vaults.flatMap((vault) =>
        vault.collateral.map((collateral) => ({ vault, collateral })),
      ),
    [vaults],
  );

  const { feed, remainingLength, showMore, amountThatWillShowNext } =
    useShowMore(collateral, COLLATERAL_INCREMENT);

  if (!vaults || vaults.length === 0) {
    return (
      <Fieldset legend="🖼 Collateral">
        No collateral associated with this controller
      </Fieldset>
    );
  }

  return (
    <Fieldset legend="🖼 Collateral">
      <div className={styles.wrapper}>
        {feed.map(({ vault: v, collateral: c }) => (
          <Tile
            key={c.id}
            address={v.token.id}
            tokenId={c.tokenId}
            paprController={paprController}
            vault={v}
          />
        ))}
      </div>
      {remainingLength > 0 && (
        <div className={styles['button-container']}>
          <TextButton kind="clickable" onClick={showMore}>
            Load {amountThatWillShowNext} more (of {remainingLength})
          </TextButton>
        </div>
      )}
    </Fieldset>
  );
}

type TileProps = {
  address: string;
  tokenId: string;
  paprController: PaprController;
  vault: NonNullable<PaprController['vaults']>['0'];
};
function Tile({ address, tokenId, paprController, vault }: TileProps) {
  const { centerNetwork } = useConfig();

  const result = useCollection({ network: centerNetwork as any, address });
  const maxLTV = useMemo(() => {
    return paprController.maxLTVBigNum;
  }, [paprController]);
  const maxDebt = useMaxDebt(address);
  const debt = useMemo(() => ethers.BigNumber.from(vault.debt), [vault.debt]);
  const ltv = useMemo(() => {
    if (!maxLTV || !maxDebt) return null;
    return computeLTVFromDebts(
      debt,
      maxDebt,
      maxLTV,
      paprController.debtToken.decimals,
    );
  }, [maxLTV, maxDebt, debt, paprController.debtToken.decimals]);

  const tooltip = useTooltipState();
  return (
    <div className={styles.tile}>
      <TooltipReference {...tooltip}>
        <CenterAsset address={address} tokenId={tokenId} preset="small" />
      </TooltipReference>
      <Tooltip {...tooltip}>
        {result?.name} #{tokenId}
        <br />
        LTV: {ltv ? formatPercent(ltv) : '...'}
      </Tooltip>
    </div>
  );
}
