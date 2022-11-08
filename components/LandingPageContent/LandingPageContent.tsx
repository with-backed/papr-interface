import React from 'react';
import styles from './LandingPageContent.module.css';

export function LandingPageContent() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.heading}>
        NFT lending
        <br />
        powered by Uniswap V3.
      </h1>
    </div>
  );
}
