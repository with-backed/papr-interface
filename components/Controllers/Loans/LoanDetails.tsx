import React from 'react';
import { Fieldset } from 'components/Fieldset';
import { VaultRow } from 'components/Controllers/Loans/VaultRow';
import styles from './Loans.module.css';
import { Table } from 'components/Table';

type LoanDetailsProps = {
  // TODO: type
  vault: any;
};

export function LoanDetails({ vault }: LoanDetailsProps) {
  return (
    <Fieldset legend={'💸 Loan Details'}>
      <Table className={styles.table}>
        <thead>
          <tr>
            <th>Loan</th>
            <th className={styles['right-align']}>Borrowed</th>
            <th className={styles['right-align']}>LTV</th>
            <th className={styles['center-align']}>Health</th>
          </tr>
        </thead>
        <tbody>
          <VaultRow vault={vault} account={vault?.account} />
        </tbody>
      </Table>
    </Fieldset>
  );
}
