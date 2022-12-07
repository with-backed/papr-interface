import React, { useMemo } from 'react';
import { Fieldset } from 'components/Fieldset';
import { VaultRow } from 'components/Controllers/Loans/VaultRow';
import { PaprController } from 'lib/PaprController';
import { useAsyncValue } from 'hooks/useAsyncValue';
import styles from './Loans.module.css';
import { computeLtv, convertOneScaledValue } from 'lib/controllers';
import { Table } from 'components/Table';
import { ethers } from 'ethers';

type LoanDetailsProps = {
  vaultId: string;
  paprController: PaprController;
};

export function LoanDetails({ paprController, vaultId }: LoanDetailsProps) {
  const vault = useMemo(() => {
    return paprController.vaults?.find((v) => v.id === vaultId);
  }, [paprController, vaultId]);
  const norm = useAsyncValue(
    () => paprController.newTarget(),
    [paprController],
  );
  const maxLTV = useMemo(() => paprController.maxLTVBigNum, [paprController]);
  const ltv = useMemo(() => {
    if (vault && norm) {
      return convertOneScaledValue(
        // TODO, punting on borrow page rework
        computeLtv(vault.debt, 1, norm),
        4,
      );
    }
    return undefined;
  }, [vault, norm]);
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
            debt={vault!.debt}
            maxLTV={maxLTV}
            ltv={ltv}
            controllerId={paprController.id}
          />
        </tbody>
      </Table>
    </Fieldset>
  );
}
