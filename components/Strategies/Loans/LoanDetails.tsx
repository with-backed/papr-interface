import React, { useMemo } from 'react';
import { Fieldset } from 'components/Fieldset';
import { VaultRow } from 'components/Strategies/Loans/VaultRow';
import { LendingStrategy } from 'lib/LendingStrategy';
import { useAsyncValue } from 'hooks/useAsyncValue';
import styles from './Loans.module.css';
import { computeLtv, convertOneScaledValue } from 'lib/strategies';
import { Table } from 'components/Table';

type LoanDetailsProps = {
  vaultId: string;
  lendingStrategy: LendingStrategy;
};

export function LoanDetails({ lendingStrategy, vaultId }: LoanDetailsProps) {
  const vault = useMemo(() => {
    return lendingStrategy.vaults?.find((v) => v.id === vaultId);
  }, [lendingStrategy, vaultId]);
  const norm = useAsyncValue(
    () => lendingStrategy.newNorm(),
    [lendingStrategy],
  );
  const maxLTV = useAsyncValue(
    () => lendingStrategy.maxLTV(),
    [lendingStrategy],
  );
  const ltv = useMemo(() => {
    if (vault && norm) {
      return convertOneScaledValue(
        computeLtv(vault.debt, vault.totalCollateralValue, norm),
        4,
      );
    }
    return undefined;
  }, [vault, norm]);
  return (
    <Fieldset legend={'💸 Loan Details'}>
      <Table>
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
            debt={vault!.debt}
            decimals={lendingStrategy.underlying.decimals}
            symbol={lendingStrategy.underlying.symbol}
            maxLTV={maxLTV}
            ltv={ltv}
            strategyId={lendingStrategy.id}
            expanded={false}
          />
        </tbody>
      </Table>
    </Fieldset>
  );
}
