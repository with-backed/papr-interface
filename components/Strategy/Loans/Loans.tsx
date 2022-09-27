import { Fieldset } from 'components/Fieldset';
import { LendingStrategy } from 'lib/LendingStrategy';
import React, { useMemo } from 'react';
import styles from './Loans.module.css';

type LoansProps = {
  lendingStrategy: LendingStrategy;
};

export function Loans({ lendingStrategy }: LoansProps) {
  console.log({ lendingStrategy });
  const activeVaults = useMemo(
    () =>
      lendingStrategy.vaults?.filter((v) => v.totalCollateralValue > 0) || [],
    [lendingStrategy],
  );
  console.log({ activeVaults });

  return (
    <Fieldset legend="💸 Loans">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Total</th>
            <th>Amount</th>
            <th>Days</th>
            <th>Avg. LTV</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.row}>
            <td>{activeVaults.length} Loans</td>
            <td>$1.165M</td>
            <td>22</td>
            <td>44%</td>
            <td>-R-C-|-----</td>
          </tr>
        </tbody>
      </table>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Loan</th>
            <th>Amount</th>
            <th>Days</th>
            <th>LTV</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody>
          {activeVaults.map((v) => {
            return (
              <tr key={v.id} className={styles.row}>
                <td>{v.id.substring(0, 8)}</td>
                <td>{v.debt}</td>
                <td>???</td>
                <td>44%</td>
                <td>???</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Fieldset>
  );
}
