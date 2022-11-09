import Image from 'next/image';
import React from 'react';
import PaprHeroesLogo from 'public/logos/paprHeroes.png';
import styles from './LandingPageContent.module.css';
import { ButtonLink } from 'components/Button';

const Background = () => <div className={styles['papr-heroes-background']} />;

const Logo = () => <img src={PaprHeroesLogo.src} alt="" />;

// TODO: make this dynamic when we have some scores
function Leaderboard() {
  return (
    <div className={styles.leaderboard}>
      <h3>LEADERBOARD</h3>
      <dl>
        <dt>
          superdude.eth<span aria-hidden>....................</span>
        </dt>
        <dd>18,239 USDC</dd>
        <dt>
          sbf.eth<span aria-hidden>..........................</span>
        </dt>
        <dd>17,267 USDC</dd>
        <dt>
          0xa47381e<span aria-hidden>........................</span>
        </dt>
        <dd>17,221 USDC</dd>
      </dl>
    </div>
  );
}

export function PaprHeroes() {
  return (
    <div className={styles.layered}>
      <Background />
      <div className={styles['papr-heroes-container']}>
        <Logo />
        <h2>
          A trading competition on testnet, with fake money
          <br />
          and Goerli versions of CC0 NFTs.
        </h2>
        <ButtonLink kind="primary" href="">
          Join the game
        </ButtonLink>
        <Leaderboard />
      </div>
    </div>
  );
}
