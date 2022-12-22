import React, { useMemo } from 'react';
import { Fieldset } from 'components/Fieldset';
import { VaultRow } from 'components/Controllers/Loans/VaultRow';
import { PaprController } from 'lib/PaprController';
import styles from './Loans.module.css';
import { Table } from 'components/Table';

type LoanDetailsProps = {
  vaultId: string;
  paprController: PaprController;
};

export function LoanDetails({ paprController, vaultId }: LoanDetailsProps) {
  const vault = useMemo(() => {
    return paprController.vaults?.find((v) => v.id === vaultId);
  }, [paprController, vaultId]);
  const maxLTV = useMemo(() => paprController.maxLTVBigNum, [paprController]);
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
          <VaultRow
            id={vaultId}
            account={vault?.account}
            maxLTV={maxLTV}
            paprController={paprController}
          />
        </tbody>
      </Table>
    </Fieldset>
  );
}
