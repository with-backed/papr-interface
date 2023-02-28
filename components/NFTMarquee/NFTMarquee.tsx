import { useCollection } from '@center-inc/react';
import { CenterAsset } from 'components/CenterAsset';
import { Tooltip } from 'components/Tooltip';
import { useConfig } from 'hooks/useConfig';
import { useMemo } from 'react';
import Marquee from 'react-fast-marquee';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';
import { VaultCollateral } from 'types/generated/graphql/inKindSubgraph';

import styles from './NFTMarquee.module.css';

type NFTMarqueeProps = {
  collateral: VaultCollateral[];
};

export function NFTMarquee({ collateral }: NFTMarqueeProps) {
  const { centerNetwork } = useConfig();
  const result = useCollection({
    network: centerNetwork as any,
    address: collateral[0].id.split('-')[0],
  });
  const tooltip = useTooltipState({ placement: 'right' });
  const pxPerSecond = useMemo(() => {
    // each image is 50px wide
    // scroll lasts for 7 seconds
    return Math.floor((collateral.length * 50) / 7);
  }, [collateral]);

  return (
    <div className={styles.wrapper}>
      <TooltipReference {...tooltip}>
        <Marquee
          style={{ width: '50px', height: '50px', overflow: 'hidden' }}
          speed={pxPerSecond}
          play={collateral.length > 1}
          pauseOnHover
          // gradient messed with our CSS
          gradient={false}>
          {collateral.map((c) => (
            <CenterAsset
              key={c.id}
              address={c.id.split('-')[0]}
              tokenId={c.tokenId}
              preset="small"
            />
          ))}
        </Marquee>
      </TooltipReference>
      <Tooltip {...tooltip}>
        <div className={styles['collateral-column']}>
          {collateral.map((c) => (
            <div className={styles['collateral-row']} key={c.id}>
              <CenterAsset
                address={c.id.split('-')[0]}
                tokenId={c.tokenId}
                preset="small"
              />
              <span>
                {result?.name} #{c.tokenId}
              </span>
            </div>
          ))}
        </div>
      </Tooltip>
    </div>
  );
}
