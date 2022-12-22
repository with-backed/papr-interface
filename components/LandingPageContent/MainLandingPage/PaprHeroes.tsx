import React from 'react';
import PaprHeroesLogo from 'public/logos/paprHeroes.png';
import Hero1 from 'public/landing-page-nfts/hero-1.png';
import Hero2 from 'public/landing-page-nfts/hero-2.png';
import Hero3 from 'public/landing-page-nfts/hero-3.png';
import Hero4 from 'public/landing-page-nfts/hero-4.png';
import styles from './LandingPageContent.module.css';
import { ButtonLink } from 'components/Button';
import { Disclosure } from 'components/Disclosure';
import Image from 'next/legacy/image';

const Logo = () => (
  <div className={styles.img}>
    <Image src={PaprHeroesLogo} alt="" placeholder="blur" />
  </div>
);

function Rules() {
  const currencyName = <i>phUSDC</i>;
  return (
    <div className={styles.rules}>
      <Disclosure title="Rules of the game">
        <p>
          Papr Hero is a PVP competition where players compete to see who can
          end up with the most {currencyName}. Every player starts with a fixed
          amount of {currencyName} and eligible NFTs. Players can perform one or
          more of the following actions to increase their {currencyName}{' '}
          balance:
        </p>
        <ol>
          <li>Lock NFTs as collateral and borrow {currencyName}</li>
          <li>Stake {currencyName} for 10% APR</li>
          <li>Sell their NFTs for {currencyName}</li>
          <li>Buy NFTs with their {currencyName}</li>
        </ol>
        <p>
          At the end of the competition, a users final {currencyName} score is
          the sum of their {currencyName} balance as well as the value of their
          NFTs (as calculated by the floor price of the collection)
        </p>
      </Disclosure>
    </div>
  );
}

export function PaprHeroes() {
  return (
    <div className={styles['papr-heroes-container']}>
      <Logo />
      <h2>
        A testnet competition, with fake money and Goerli versions of CC0 NFTs.
      </h2>
      <ButtonLink
        kind="outline"
        theme="hero"
        href="https://backed.mirror.xyz/vo5BnBJFKVho4nreXlPRLYYRfuMYGrWpXSwzDdDcork"
        newTab>
        Read the Recap
      </ButtonLink>
      <div className={styles.heroes}>
        <Image src={Hero1} alt="" quality={100} />
        <Image src={Hero2} alt="" quality={100} />
        <Image src={Hero3} alt="" quality={100} />
        <Image src={Hero4} alt="" quality={100} />
      </div>
    </div>
  );
}
