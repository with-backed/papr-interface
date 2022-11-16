import React from 'react';
import LandingPageScale from 'public/landingpage-scale.png';
import styles from './LandingPageContent.module.css';
import Image from 'next/image';
import { Tables } from './Tables';
import { DashedLine } from './DashedLine';
import { Whitepaper } from './Whitepaper';
import { PaprHeroes } from './PaprHeroes';
import { PaprMeme } from './PaprMeme';
import { FAQ } from './FAQ';
import { LandingPageDiagram } from './LandingPageDiagram';

export function LandingPageContent() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.heading}>
        NFT lending
        <br />
        powered by Uniswap V3.
      </h1>
      <div className={styles['scale-container']}>
        <Image src={LandingPageScale} alt="" priority placeholder="blur" />
      </div>
      <div className={styles.wrapper}>
        <DashedLine />
        <Tables />
        <LandingPageDiagram />
        <Whitepaper />
        <PaprHeroes />
        <PaprMeme />
        <FAQ />
      </div>
    </div>
  );
}
