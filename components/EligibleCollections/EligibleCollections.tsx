import { TextButton } from 'components/Button';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { calculateMaxDebt } from 'hooks/useMaxDebt';
import {
  OracleInfo,
  OracleInfoProvider,
  useOracleInfo,
} from 'hooks/useOracleInfo/useOracleInfo';
import { TargetUpdate, useTarget } from 'hooks/useTarget';
import { SECONDS_IN_A_YEAR } from 'lib/constants';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { SubgraphController } from 'lib/PaprController';
import { subgraphControllerByAddress } from 'lib/pAPRSubgraph';
import { percentChange } from 'lib/tokenPerformance';
import Image from 'next/image';
import Bean from 'public/landing-page-nfts/bean.png';
import CoolCat from 'public/landing-page-nfts/cool-cat.png';
import Dickbutt from 'public/landing-page-nfts/dickbutt.png';
import Loot from 'public/landing-page-nfts/loot.png';
import Mfer from 'public/landing-page-nfts/mfer.png';
import Milady from 'public/landing-page-nfts/milady.png';
import PudgyPenguin from 'public/landing-page-nfts/pudgy-penguin.png';
import Toad from 'public/landing-page-nfts/toad.png';
import TubbyCat from 'public/landing-page-nfts/tubby-cat.png';
import Wizard from 'public/landing-page-nfts/wizard.png';
import { useCallback, useMemo, useState } from 'react';
import Marquee from 'react-fast-marquee';

import styles from './EligibleCollections.module.css';

const COLLECTIONS = [
  {
    address: '0x1a92f7381b9f03921564a437210bb9396471050c',
    name: 'Cool Cats',
    image: CoolCat,
  },
  {
    address: '0x1cb1a5e65610aeff2551a50f76a87a7d3fb649c6',
    name: 'CrypToadz',
    image: Toad,
  },
  {
    address: '0x306b1ea3ecdf94ab739f1910bbda052ed4a9f949',
    name: 'BEANZ',
    image: Bean,
  },
  {
    address: '0x42069abfe407c60cf4ae4112bedead391dba1cdb',
    name: 'CryptoDickbutts',
    image: Dickbutt,
  },
  {
    address: '0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42',
    name: 'Forgotten Runes Wizards Cult',
    image: Wizard,
  },
  {
    address: '0x5af0d9827e0c53e4799bb226655a1de152a425a5',
    name: 'Milady Maker',
    image: Milady,
  },
  {
    address: '0x79fcdef22feed20eddacbb2587640e45491b757f',
    name: 'mfers',
    image: Mfer,
  },
  {
    address: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
    name: 'Pudgy Penguins',
    image: PudgyPenguin,
  },
  {
    address: '0xca7ca7bcc765f77339be2d648ba53ce9c8a262bd',
    name: 'Tubby Cats',
    image: TubbyCat,
  },
  {
    address: '0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7',
    name: 'Loot (for Adventurers)',
    image: Loot,
  },
];

export function EligibleCollections() {
  const collections = useMemo(() => COLLECTIONS.map((c) => c.address), []);
  return (
    <OracleInfoProvider collections={collections}>
      <EligibleCollectionsInner />
    </OracleInfoProvider>
  );
}

export function EligibleCollectionsInner() {
  const config = useConfig();
  const subgraphData = useAsyncValue(
    () => subgraphControllerByAddress(config.controllerAddress, 'paprMeme'),
    [config],
  );
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const targetResult = useTarget();

  return (
    <div className={styles.wrapper}>
      <APR paprController={subgraphData?.paprController} />
      <Marquee className={styles.marquee} pauseOnHover gradient={false}>
        {COLLECTIONS.map((c) => (
          <Collection
            paprController={subgraphData?.paprController}
            oracleInfo={oracleInfo}
            targetResult={targetResult}
            key={c.address + '-1'}
            collectionInfo={c}
          />
        ))}
        {COLLECTIONS.map((c) => (
          <Collection
            paprController={subgraphData?.paprController}
            oracleInfo={oracleInfo}
            targetResult={targetResult}
            key={c.address + '-2'}
            collectionInfo={c}
          />
        ))}
      </Marquee>
    </div>
  );
}

type CollectionProps = {
  collectionInfo: typeof COLLECTIONS[number];
  oracleInfo?: OracleInfo;
  paprController?: SubgraphController | null;
  targetResult?: TargetUpdate;
};
function Collection({
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
        console.log('bailing ');
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
    <div>
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
        />
        <div
          className={
            isHovered ? styles['name-bubble-visible'] : styles['name-bubble']
          }>
          {name}
        </div>
      </div>
    </div>
  );
}

type APRProps = {
  paprController?: SubgraphController | null;
};

function APR({ paprController }: APRProps) {
  const newTargetResult = useTarget();

  const currentTargetNumber = useMemo(() => {
    if (paprController) {
      return parseFloat(
        ethers.utils.formatUnits(
          paprController.currentTarget,
          paprController.underlying.decimals,
        ),
      );
    }
    return null;
  }, [paprController]);

  const newTargetNumber = useMemo(() => {
    if (!newTargetResult || !paprController) {
      return null;
    }
    return parseFloat(
      ethers.utils.formatUnits(
        newTargetResult.target,
        paprController.underlying.decimals,
      ),
    );
  }, [newTargetResult, paprController]);

  const contractAPR = useMemo(() => {
    if (
      !newTargetResult ||
      !newTargetNumber ||
      !currentTargetNumber ||
      !paprController
    ) {
      return null;
    }
    const change = percentChange(currentTargetNumber, newTargetNumber);
    // convert to APR
    return formatPercent(
      (change /
        (newTargetResult.timestamp - paprController.currentTargetUpdated)) *
        SECONDS_IN_A_YEAR,
    );
  }, [newTargetNumber, currentTargetNumber, newTargetResult, paprController]);

  return (
    <div className={styles.bubble}>
      <span>
        <TextButton className={styles['connect-button']}>
          See your max loan
        </TextButton>
        . paprMEME makes instant{' '}
        <span className={styles.green}>loans at {contractAPR || '...%'}</span>{' '}
        for meme collections, up to:
      </span>
    </div>
  );
}
