import React from 'react';
import PaprHeroesLogo from 'public/logos/paprHeroes.png';
import Hero1 from 'public/landing-page-nfts/hero-1.png';
import Hero2 from 'public/landing-page-nfts/hero-2.png';
import Hero3 from 'public/landing-page-nfts/hero-3.png';
import Hero4 from 'public/landing-page-nfts/hero-4.png';
import styles from './LandingPageContent.module.css';
import { Button } from 'components/Button';
import { Disclosure } from 'components/Disclosure';
import Image from 'next/image';

const Logo = () => <img src={PaprHeroesLogo.src} alt="" />;

// TODO: make this dynamic when we have some scores
function Leaderboard() {
  return (
    <div className={styles.leaderboard}>
      <h3>LEADERBOARD</h3>
      <dl>
        <dt>
          superdude.eth
          <div className={styles.dotted} />
        </dt>
        <dd>18,239 USDC</dd>
        <dt>
          vitalik.eth
          <div className={styles.dotted} />
        </dt>
        <dd>17,267 USDC</dd>
        <dt>
          0xa47381e
          <div className={styles.dotted} />
        </dt>
        <dd>17,221 USDC</dd>
      </dl>
    </div>
  );
}

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
        A trading competition on testnet, with fake money and Goerli versions of
        CC0 NFTs.
      </h2>
      <Button kind="outline-transparent" theme="hero" disabled>
        Coming soon!
      </Button>
      <div className={styles.heroes}>
        <Image src={Hero1} alt="" />
        <Image src={Hero2} alt="" />
        <Image src={Hero3} alt="" />
        <Image src={Hero4} alt="" />
      </div>
      {/* <Leaderboard /> */}
    </div>
  );
}
