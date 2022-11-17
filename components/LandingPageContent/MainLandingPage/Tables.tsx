import { ButtonLink } from 'components/Button';
import React, { FunctionComponent } from 'react';
import styles from './LandingPageContent.module.css';

const BORROWER_ENTRIES = [
  ['💰', 'USDC loans, instantly'],
  ['💸', 'Borrow and repay as you go'],
  ['⏱', 'Unlimited duration'],
  ['👜', 'Borrow with many NFTs in a single tx'],
  ['🐌', 'Loans liquidate one NFT at a time'],
];

const LP_ENTRIES = [
  ['🌈', 'Exposure across many loans and collections'],
  ['💎', 'Low maintenance, just buy and hold'],
  ['🛌', 'Zero unused capital'],
  ['🪙', 'Convert back to USDC whenever you want, no lockups'],
];

type RowProps = {
  emoji: string;
  text: string;
};
function Row({ emoji, text }: RowProps) {
  return (
    <tr>
      <td>{emoji}</td>
      <td>{text}</td>
    </tr>
  );
}

const Header: FunctionComponent<{}> = ({ children }) => (
  <thead>
    <tr>
      <th colSpan={2}>{children}</th>
    </tr>
  </thead>
);

const Background = () => <div className={styles['table-background']} />;

function BorrowerTable() {
  return (
    <div className={styles['table-wrapper']}>
      <table className={styles.table}>
        <Header>BORROWERS</Header>
        <tbody>
          {BORROWER_ENTRIES.map(([emoji, text]) => (
            <Row key={text} emoji={emoji} text={text} />
          ))}
        </tbody>
      </table>
      {/* <ButtonLink href="" kind="outline" theme="papr">
        Get a loan
      </ButtonLink> */}
    </div>
  );
}

function LPTable() {
  return (
    <div className={styles['table-wrapper']}>
      <table className={styles.table}>
        <Header>LPs & HOLDERS</Header>
        <tbody>
          {LP_ENTRIES.map(([emoji, text]) => (
            <Row key={text} emoji={emoji} text={text} />
          ))}
        </tbody>
      </table>
      {/* <ButtonLink href="" kind="outline" theme="papr">
        Buy papr
      </ButtonLink> */}
    </div>
  );
}

export function Tables() {
  return (
    <>
      <div className={styles['table-layered']}>
        <Background />
        <div className={styles['tables-container']}>
          <BorrowerTable />
          <LPTable />
        </div>
      </div>
      <div className={styles['table-mobile']}>
        <BorrowerTable />
        <LPTable />
      </div>
    </>
  );
}
