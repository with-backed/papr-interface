import { useCollection } from '@center-inc/react';
import { CenterAsset } from 'components/CenterAsset';
import { Tooltip } from 'components/Tooltip';
import { useConfig } from 'hooks/useConfig';
import Marquee from 'react-fast-marquee';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';

import styles from './NFTMarquee.module.css';

type NFTMarqueeProps = {
  collateralContractAddress: string;
  tokenIds: string[];
};

export function NFTMarquee({
  collateralContractAddress,
  tokenIds,
}: NFTMarqueeProps) {
  const { centerNetwork } = useConfig();
  const result = useCollection({
    network: centerNetwork as any,
    address: collateralContractAddress,
  });
  const tooltip = useTooltipState({ placement: 'right' });

  return (
    <div className={styles.wrapper}>
      <TooltipReference {...tooltip}>
        <Marquee
          className={styles.marquee}
          play={tokenIds.length > 1}
          pauseOnHover
          speed={10}
          // gradient messed with our CSS
          gradient={false}>
          {tokenIds.map((tokenId) => (
            <CenterAsset
              key={tokenId}
              address={collateralContractAddress}
              tokenId={tokenId}
              preset="small"
            />
          ))}
        </Marquee>
      </TooltipReference>
      <Tooltip {...tooltip}>
        <div className={styles['collateral-column']}>
          {tokenIds.map((tokenId) => (
            <div className={styles['collateral-row']} key={tokenId}>
              <CenterAsset
                address={collateralContractAddress}
                tokenId={tokenId}
                preset="small"
              />
              <span>
                {result?.name} #{tokenId}
              </span>
            </div>
          ))}
        </div>
      </Tooltip>
    </div>
  );
}
