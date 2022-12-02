import React, { useMemo } from 'react';
import { PaprController } from 'lib/PaprController';
import { useAsyncValue } from 'hooks/useAsyncValue';
import styles from './Loans.module.css';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { VaultRow } from './VaultRow';
type LoanDetailsProps = {
  vaultId: string;
  paprController: PaprController;
};

export function LoanDetails({ paprController, vaultId }: LoanDetailsProps) {
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const vault = useMemo(() => {
    return paprController.vaults?.find((v) => v.id === vaultId);
  }, [paprController, vaultId]);
  const norm = useAsyncValue(
    () => paprController.newTarget(),
    [paprController],
  );
  const maxLTV = useAsyncValue(() => paprController.maxLTV(), [paprController]);
  const ltv = useAsyncValue(async () => {
    if (!vault || !oracleInfo) return 0;
    return paprController.ltv(
      vault.debt,
      [vault.collateralContract],
      oracleInfo,
    );
  }, [vault, oracleInfo, paprController]);
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
        {ltv == undefined ? (
          ''
        ) : (
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
        )}
      </Table>
    </Fieldset>
  );
}
