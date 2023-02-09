import { GradientButtonLink } from 'components/Button';
import { useConfig } from 'hooks/useConfig';
import { FunctionComponent } from 'react';

import styles from './LandingPageContent.module.css';

const BORROWER_ENTRIES = [
  ['💰', 'ETH loans, instantly'],
  ['💸', 'Borrow and repay as you go'],
  ['⏱', 'Unlimited duration'],
  ['👜', 'Borrow with many NFTs in a single tx'],
  ['🐌', 'Loans liquidate one NFT at a time'],
];

const LP_ENTRIES = [
  ['🌈', 'Exposure across many loans and collections'],
  ['💎', 'Low maintenance, just buy and hold'],
  ['🛌', 'Zero unused capital'],
  ['🪙', 'Convert back to ETH whenever you want, no lockups'],
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

const Header: FunctionComponent = ({ children }) => (
  <thead>
    <tr>
      <th colSpan={2}>{children}</th>
    </tr>
  </thead>
);

const Background = () => <div className={styles['table-background']} />;

function BorrowerTable() {
  const { tokenName } = useConfig();
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
      <GradientButtonLink href={`/tokens/${tokenName}/borrow`} color="orange">
        Get a loan
      </GradientButtonLink>
    </div>
  );
}

function LPTable() {
  const { tokenName } = useConfig();
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
      <GradientButtonLink href={`/tokens/${tokenName}/swap`} color="orange">
        Buy papr
      </GradientButtonLink>
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
