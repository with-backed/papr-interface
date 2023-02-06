import { useCollection } from '@center-inc/react';
import { TextButton } from 'components/Button';
import { CenterAsset } from 'components/CenterAsset';
import { Fieldset } from 'components/Fieldset';
import { Tooltip } from 'components/Tooltip';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { PaprController, useController } from 'hooks/useController';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { useMaxDebt } from 'hooks/useMaxDebt';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useShowMore } from 'hooks/useShowMore';
import { computeLTVFromDebts } from 'lib/controllers';
import { formatPercent } from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import React, { useMemo } from 'react';
import { TooltipReference, useTooltipState } from 'reakit';
import { erc20ABI, useContractRead } from 'wagmi';

import styles from './Collateral.module.css';

type CollateralProps = {
  // If scoping collateral view to just a specific vault
  // instead of the whole controller
  vaultId?: string;
};

const COLLATERAL_INCREMENT = 30;

export function Collateral({ vaultId }: CollateralProps) {
  const paprController = useController();
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const latestMarketPrice = useLatestMarketPrice();
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

  const totalCollateralValue = useMemo(() => {
    if (!oracleInfo) return null;
    return collateral
      .map(({ vault }) => oracleInfo[vault.token.id].price)
      .reduce((a, b) => a + b, 0);
  }, [collateral, oracleInfo]);
  const { data: totalSupply } = useContractRead({
    abi: erc20ABI,
    address: paprController.paprToken.id as `0x${string}`,
    functionName: 'totalSupply',
  });
  const totalSupplyInUnderlying = useMemo(() => {
    if (!totalSupply || !latestMarketPrice) return null;
    return (
      parseFloat(
        ethers.utils.formatUnits(
          totalSupply,
          paprController.paprToken.decimals,
        ),
      ) * latestMarketPrice
    );
  }, [latestMarketPrice, paprController.paprToken.decimals, totalSupply]);
  const collateralizationRatio = useMemo(() => {
    if (!totalCollateralValue || !totalSupply) return null;
    const totalSupplyNum = parseFloat(
      ethers.utils.formatUnits(totalSupply, paprController.paprToken.decimals),
    );
    return totalCollateralValue / totalSupplyNum;
  }, [totalCollateralValue, totalSupply, paprController.paprToken.decimals]);

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
      <div className={styles.stats}>
        <div>
          <div>
            <p>Floor value of all deposited collateral</p>
          </div>
          <div>
            {!totalCollateralValue && <p>...</p>}
            {totalCollateralValue && (
              <p>
                {totalCollateralValue.toFixed(4)}{' '}
                {paprController.underlying.symbol}
              </p>
            )}
          </div>
        </div>
        <div>
          <div>
            <p>Market value of all {paprController.paprToken.symbol} tokens</p>
          </div>
          <div>
            {!totalSupplyInUnderlying && <p>...</p>}
            {totalSupplyInUnderlying && (
              <p>
                {totalSupplyInUnderlying.toFixed(4)}{' '}
                {paprController.underlying.symbol}
              </p>
            )}
          </div>
        </div>
        <div>
          <div>
            <p>Collateralization ratio (NFT value/token value)</p>
          </div>
          <div>
            {!collateralizationRatio && <p>...</p>}
            {collateralizationRatio && (
              <p>{collateralizationRatio.toFixed(2)}</p>
            )}
          </div>
        </div>
      </div>
      <div className={styles.wrapper}>
        {feed.map(({ vault: v, collateral: c }) => (
          <Tile key={c.id} address={v.token.id} tokenId={c.tokenId} vault={v} />
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
  vault: NonNullable<PaprController['vaults']>['0'];
};
function Tile({ address, tokenId, vault }: TileProps) {
  const { maxLTV, paprToken } = useController();
  const { centerNetwork } = useConfig();

  const result = useCollection({ network: centerNetwork as any, address });
  const maxDebt = useMaxDebt(address, OraclePriceType.twap);
  const debt = useMemo(() => ethers.BigNumber.from(vault.debt), [vault.debt]);
  const ltv = useMemo(() => {
    if (!maxLTV || !maxDebt) return null;
    return computeLTVFromDebts(debt, maxDebt, maxLTV, paprToken.decimals);
  }, [maxLTV, maxDebt, debt, paprToken.decimals]);

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
