import Image from 'next/image';
import React from 'react';
import PaprMemeLogo from 'public/logos/paprMeme.png';
import Memes from 'public/memes.png';
import styles from './LandingPageContent.module.css';
import { ButtonLink } from 'components/Button';
import { Disclosure } from 'components/Disclosure';

function FAQ() {
  return (
    <div className={styles.rules}>
      <Disclosure title="Why these NFTs in particular?">
        Rules go here tbqh
      </Disclosure>
    </div>
  );
}

export function PaprMeme() {
  return (
    <div className={styles['papr-meme-container']}>
      <Image src={PaprMemeLogo} alt="" />
      <h2>Lends to crypto-twitter&apos;s 9 favorite, meme-ish collections.</h2>
      <ButtonLink href="" kind="outline" theme="meme">
        Coming Soon!
      </ButtonLink>
      <Image src={Memes} alt="Examples of collections used by paprMEME" />
      <FAQ />
    </div>
  );
}
