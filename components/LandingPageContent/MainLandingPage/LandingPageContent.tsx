import Image from 'next/legacy/image';
import LandingPageScale from 'public/landingpage-scale.png';
import React from 'react';

import { DashedLine } from './DashedLine';
import { FAQ } from './FAQ';
import styles from './LandingPageContent.module.css';
import { LandingPageDiagram } from './LandingPageDiagram';
import { PaprHeroes } from './PaprHeroes';
import { PaprMeme } from './PaprMeme';
import { Tables } from './Tables';
import { Whitepaper } from './Whitepaper';

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
