import { ethers } from 'ethers';
import { calculateMaxDebt } from 'hooks/useMaxDebt';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { TargetUpdate } from 'hooks/useTarget';
import { formatTokenAmount } from 'lib/numberFormat';
import { SubgraphController } from 'lib/PaprController';
import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';

import { COLLECTIONS } from './constants';
import styles from './EligibleCollections.module.css';

type CollectionProps = {
  collectionInfo: typeof COLLECTIONS[number];
  oracleInfo?: OracleInfo;
  paprController?: SubgraphController | null;
  targetResult?: TargetUpdate;
};

export function Collection({
  collectionInfo: { address, name, image },
  oracleInfo,
  paprController,
  targetResult,
}: CollectionProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const maxDebt = useMemo(() => {
    const placeholder = '...';
    if (oracleInfo && paprController && targetResult) {
      const value = calculateMaxDebt(
        address,
        oracleInfo,
        targetResult,
        paprController.maxLTV,
        paprController.underlying.decimals,
      );
      if (!value) {
        return placeholder;
      }
      const symbol =
        paprController.underlying.symbol === 'WETH'
          ? 'ETH'
          : paprController.underlying.symbol;
      return `${formatTokenAmount(
        parseFloat(
          ethers.utils.formatUnits(value, paprController.underlying.decimals),
        ),
      )} ${symbol}`;
    }
    return placeholder;
  }, [address, oracleInfo, paprController, targetResult]);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={styles['collection-tile']}>
      <div
        className={
          isHovered
            ? styles['max-loan-label-visible']
            : styles['max-loan-label']
        }>
        <span>Max Loan</span>
      </div>
      <div className={styles['max-loan']}>
        <span>{maxDebt}</span>
      </div>

      <Image
        className={styles['collection-image']}
        src={image}
        alt={name}
        height={91}
        width={91}
        placeholder="blur"
      />
      <div
        className={
          isHovered ? styles['name-bubble-visible'] : styles['name-bubble']
        }>
        {name}
      </div>
    </div>
  );
}
