import Image from 'next/image';
import React from 'react';
import PaprMemeLogo from 'public/logos/paprMeme.png';
import Memes from 'public/memes.png';
import styles from './LandingPageContent.module.css';
import { Button } from 'components/Button';
import { Disclosure } from 'components/Disclosure';

function FAQ() {
  return (
    <div className={styles.rules}>
      <Disclosure title="Why these NFTs in particular?">
        These 8 collections have large community followings. As memes they have
        stood the test of time and continue to trade with consistent value, but
        not for double-digit ETH values. They examples of NFTs that clearly have
        borrow and lending demand, but are underserved but the current product
        offerings.
      </Disclosure>
    </div>
  );
}

export function PaprMeme() {
  return (
    <div className={styles['papr-meme-container']}>
      <Image src={PaprMemeLogo} alt="" />
      <h2>Lends to crypto-twitter&apos;s 9 favorite, meme-ish collections.</h2>
      <Button kind="outline-transparent" theme="meme" disabled>
        Coming Soon!
      </Button>
      <Image src={Memes} alt="Examples of collections used by paprMEME" />
      <FAQ />
    </div>
  );
}
