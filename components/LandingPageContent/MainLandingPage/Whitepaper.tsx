import { ButtonLink } from 'components/Button';
import React from 'react';
import styles from './LandingPageContent.module.css';

export function Whitepaper() {
  return (
    <div className={styles.whitepaper}>
      <p className={styles.highlight}>The FREE MARKET sets the price</p>
      <p>
        The CONTRACT uses MARKET PRICE to determine INTEREST owed by BORROWERS,
        which is paid in the form of appreciation in the price of papr tokens.
      </p>
      <p>
        This impacts SUPPLY and DEMAND and the price of papr on UNISWAP, forming
        a perpetual feedback loop for discovering the optimal APR for loans.
      </p>
      <p className={styles.highlight}>papr = perpetual APR</p>
      <ButtonLink
        kind="outline"
        theme="papr"
        href="https://backed.mirror.xyz/8SslPvU8of0h-fxoo6AybCpm51f30nd0qxPST8ep08c"
        newTab>
        Read the whitepaper
      </ButtonLink>
    </div>
  );
}
