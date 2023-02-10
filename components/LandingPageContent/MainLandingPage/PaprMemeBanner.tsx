import { GradientButtonLink } from 'components/Button';
import { Tooltip } from 'components/Tooltip';
import { useConfig } from 'hooks/useConfig';
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
import { useEffect, useState } from 'react';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';

import styles from './LandingPageContent.module.css';

const Background = () => <div className={styles['papr-meme-background']} />;

const COLLECTIONS = {
  'Cool Cats': {
    address: '0x1a92f7381b9f03921564a437210bb9396471050c',
    name: 'Cool Cats',
    image: CoolCat,
  },
  CrypToadz: {
    address: '0x1cb1a5e65610aeff2551a50f76a87a7d3fb649c6',
    name: 'CrypToadz',
    image: Toad,
  },
  BEANZ: {
    address: '0x306b1ea3ecdf94ab739f1910bbda052ed4a9f949',
    name: 'BEANZ',
    image: Bean,
  },
  CryptoDickbutts: {
    address: '0x42069abfe407c60cf4ae4112bedead391dba1cdb',
    name: 'CryptoDickbutts',
    image: Dickbutt,
  },
  'Forgotten Runes Wizards Cult': {
    address: '0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42',
    name: 'Forgotten Runes Wizards Cult',
    image: Wizard,
  },
  'Milady Maker': {
    address: '0x5af0d9827e0c53e4799bb226655a1de152a425a5',
    name: 'Milady Maker',
    image: Milady,
  },
  mfers: {
    address: '0x79fcdef22feed20eddacbb2587640e45491b757f',
    name: 'mfers',
    image: Mfer,
  },
  'Pudgy Penguins': {
    address: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
    name: 'Pudgy Penguins',
    image: PudgyPenguin,
  },
  'Tubby Cats': {
    address: '0xca7ca7bcc765f77339be2d648ba53ce9c8a262bd',
    name: 'Tubby Cats',
    image: TubbyCat,
  },
  'Loot (for Adventurers)': {
    address: '0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7',
    name: 'Loot (for Adventurers)',
    image: Loot,
  },
};

export function PaprMemeBanner() {
  return (
    <>
      <div className={styles['papr-meme-layered']}>
        <Background />
        <div className={styles['papr-meme-wrapper']}>
          <ImageGrid />
          <Text />
        </div>
      </div>
      <div className={styles['papr-meme-mobile']}>
        <ImageGrid />
        <Text />
      </div>
    </>
  );
}

function Text() {
  const { tokenName } = useConfig();
  return (
    <div>
      <p>
        <u>First papr token ever!</u> paprMEME is a <br /> token for loans to
        these 10 collections
      </p>
      <p className={styles.pointer}>👈 INSTANT LOANS FOR MEMEish* NFTs</p>
      <ul className={styles['star-list']}>
        <li>popular but underserved</li>
        <li>durable value</li>
        <li>fun to experiment with</li>
        <li>maybe you have one</li>
      </ul>
      <GradientButtonLink href={`/tokens/${tokenName}`} color="green">
        Let&apos;s Meme!
      </GradientButtonLink>
    </div>
  );
}

type NFTImageTileProps = {
  nft: keyof typeof COLLECTIONS;
};

const NFTImageTile: React.FunctionComponent<NFTImageTileProps> = ({ nft }) => {
  const [mounted, setMounted] = useState(false);
  const tooltipState = useTooltipState();
  const { name, image } = COLLECTIONS[nft];

  useEffect(() => setMounted(true), []);

  // Hack to avoid hydration error caused by reakit tooltip
  // When we start fetching oracle info etc instead of checking mounted
  // we can avoid rendering tooltip until we have data.
  if (!mounted) {
    return (
      <Image src={image} alt="" height={90} width={90} placeholder="blur" />
    );
  }

  return (
    <>
      <TooltipReference {...tooltipState}>
        <Image
          src={image}
          alt={name}
          height={90}
          width={90}
          placeholder="blur"
        />
      </TooltipReference>
      <Tooltip {...tooltipState}>
        <span>{name}</span>
        {/* <div className={styles['tooltip-container']}>
          <span>Floor:</span>
          <span>???</span>
          <span>Max Loan:</span>
          <span>???</span>
        </div> */}
      </Tooltip>
    </>
  );
};

function ImageGrid() {
  return (
    <div className={styles['meme-grid']}>
      <div>
        <NFTImageTile nft="Milady Maker" />
        <NFTImageTile nft="Forgotten Runes Wizards Cult" />
        <NFTImageTile nft="Loot (for Adventurers)" />
      </div>
      <div>
        <NFTImageTile nft="CrypToadz" />
        <NFTImageTile nft="Pudgy Penguins" />
        <NFTImageTile nft="BEANZ" />
        <NFTImageTile nft="CryptoDickbutts" />
      </div>
      <div>
        <NFTImageTile nft="mfers" />
        <NFTImageTile nft="Cool Cats" />
        <NFTImageTile nft="Tubby Cats" />
      </div>
    </div>
  );
}
