import { TextButton } from 'components/Button';
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
import { useCallback, useState } from 'react';
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
  return (
    <div className={styles.wrapper}>
      <APR />
      <Marquee pauseOnHover gradient={false}>
        {COLLECTIONS.map((c) => (
          <Collection key={c.address} collectionInfo={c} />
        ))}
      </Marquee>
      <WalletCTA />
    </div>
  );
}

type CollectionProps = {
  collectionInfo: typeof COLLECTIONS[number];
};
function Collection({
  collectionInfo: { address, name, image },
}: CollectionProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

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
          <span>1.06 ETH</span>
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

function APR() {
  const contractAPR = '4.38%';
  return (
    <div className={styles.bubble}>
      <span>
        Instant <span className={styles.green}>Loans at {contractAPR}</span> for
        meme collections, up to:
      </span>
    </div>
  );
}

function WalletCTA() {
  return (
    <div className={styles.bubble}>
      <span>
        <TextButton className={styles['connect-button']}>Connect</TextButton> to
        see your max loan
      </span>
    </div>
  );
}
