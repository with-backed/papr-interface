import React from 'react';
import PaprHeroesLogo from 'public/logos/paprHeroes.png';
import Heroes from 'public/heroes.png';
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
  return (
    <div className={styles.rules}>
      <Disclosure title="Rules of the game">Rules go here tbqh</Disclosure>
    </div>
  );
}

export function PaprHeroes() {
  return (
    <div className={styles['papr-heroes-container']}>
      <Logo />
      <h2>
        A trading competition on testnet, with fake money
        <br />
        and Goerli versions of CC0 NFTs.
      </h2>
      <Button kind="outline-transparent" theme="hero" disabled>
        Coming soon!
      </Button>
      <Image src={Heroes} alt="Examples of collections used in paprHERO" />
      <Leaderboard />
      <Rules />
    </div>
  );
}
