import Image from 'next/image';
import React from 'react';
import PaprMemeLogo from 'public/logos/paprMeme.png';
import Meme1 from 'public/landing-page-nfts/meme-1.png';
import Meme2 from 'public/landing-page-nfts/meme-2.png';
import Meme3 from 'public/landing-page-nfts/meme-3.png';
import Meme4 from 'public/landing-page-nfts/meme-4.png';
import Meme5 from 'public/landing-page-nfts/meme-5.png';
import Meme6 from 'public/landing-page-nfts/meme-6.png';
import Meme7 from 'public/landing-page-nfts/meme-7.png';
import Meme8 from 'public/landing-page-nfts/meme-8.png';
import styles from './LandingPageContent.module.css';
import { Button } from 'components/Button';
import { Disclosure } from 'components/Disclosure';
import { Tooltip } from 'components/Tooltip';
import { useTooltipState, TooltipReference } from 'reakit/Tooltip';

function FAQ() {
  return (
    <div className={styles.rules}>
      <Disclosure title="Why these NFTs in particular?">
        <p>
          These 8 collections have large community followings. As memes they
          have stood the test of time and continue to trade with consistent
          value, but not for double-digit ETH values. They examples of NFTs that
          clearly have borrow and lending demand, but are underserved but the
          current product offerings.
        </p>
      </Disclosure>
    </div>
  );
}

export function PaprMeme() {
  const tooltip1 = useTooltipState();
  const tooltip2 = useTooltipState();
  const tooltip3 = useTooltipState();
  const tooltip4 = useTooltipState();
  const tooltip5 = useTooltipState();
  const tooltip6 = useTooltipState();
  const tooltip7 = useTooltipState();
  const tooltip8 = useTooltipState();
  return (
    <div className={styles['papr-meme-container']}>
      <Image src={PaprMemeLogo} alt="" />
      <h2>Lends to crypto-twitter&apos;s 8 favorite, meme-ish collections.</h2>
      <Button kind="outline-transparent" theme="meme" disabled>
        Coming Soon!
      </Button>
      <div className={styles.memes}>
        <TooltipReference {...tooltip1}>
          <Image src={Meme1} alt="" />
        </TooltipReference>
        <Tooltip {...tooltip1}>
          <div className={styles.tooltip}>
            mfers
            <br />
            Floor: 0.881 ETH
            <br />
            Max Loan: 532.56 USDC
          </div>
        </Tooltip>
        <TooltipReference {...tooltip2}>
          <Image src={Meme2} alt="" />
        </TooltipReference>
        <Tooltip {...tooltip2}>
          <div className={styles.tooltip}>
            Dickbutts
            <br />
            Floor: 2 ETH
            <br />
            Max Loan: 1,209.00 USDC
          </div>
        </Tooltip>
        <TooltipReference {...tooltip3}>
          <Image src={Meme3} alt="" />
        </TooltipReference>
        <Tooltip {...tooltip3}>
          <div className={styles.tooltip}>
            CryptoToadz
            <br />
            Floor: 1.385 ETH
            <br />
            Max Loan: 837.23 USDC
          </div>
        </Tooltip>
        <Image src={Meme4} alt="" />
        <Image src={Meme5} alt="" />
        <Image src={Meme6} alt="" />
        <Image src={Meme7} alt="" />
        <Image src={Meme8} alt="" />
      </div>
      <FAQ />
    </div>
  );
}
