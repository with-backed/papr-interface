import React from 'react';
import styles from './LandingPageContent.module.css';

export function Whitepaper() {
  return (
    <div className={styles.whitepaper}>
      <p>
        The CONTRACT uses MARKET PRICE to determine INTEREST owed by BORROWERS,
        <br />
        which is paid in the form of appreciation in the price of papr tokens.
        <br />
        This impacts SUPPLY and DEMAND and the price of papr on UNISWAP, forming
        a perpetual
        <br />
        feedback loop for discovering the optimal APR for loans.
      </p>
    </div>
  );
}
