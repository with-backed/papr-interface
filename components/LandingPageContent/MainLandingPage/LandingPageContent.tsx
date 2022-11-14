import React from 'react';
import LandingPageScale from 'public/landingpage-scale.png';
import { LandingPageDiagram } from './LandingPageDiagram';
import styles from './LandingPageContent.module.css';
import Image from 'next/image';
import { Tables } from './Tables';
import { DashedLine } from './DashedLine';
import { Whitepaper } from './Whitepaper';
import { PaprHeroes } from './PaprHeroes';
import { PaprMeme } from './PaprMeme';
import { FAQ } from './FAQ';

export function LandingPageContent() {
  return (
    <>
      <h1 className={styles.heading}>
        NFT lending
        <br />
        powered by Uniswap V3.
      </h1>
      <div className={styles['scale-container']}>
        <Image src={LandingPageScale} alt="" />
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
    </>
  );
}
