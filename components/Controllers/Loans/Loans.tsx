import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { PaprController } from 'lib/PaprController';
import {
  formatBigNum,
  formatPercent,
  formatTokenAmount,
} from 'lib/numberFormat';
import { computeLtv, convertOneScaledValue } from 'lib/controllers';
import { ControllerPricesData } from 'lib/controllers/charts';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './Loans.module.css';
import { VaultRow } from './VaultRow';
import { Table } from 'components/Table';
import { VaultHealth } from './VaultHealth';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { useLTVs } from 'hooks/useLTVs/useLTVs';

type LoansProps = {
  paprController: PaprController;
  pricesData: ControllerPricesData | null;
};

export function Loans({ paprController, pricesData }: LoansProps) {
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const norm = useAsyncValue(
    () => paprController.newTarget(),
    [paprController],
  );
  const maxLTV = useAsyncValue(() => paprController.maxLTV(), [paprController]);
  const activeVaults = useMemo(
    () => paprController.vaults?.filter((v) => v.debt > 0) || [],
    [paprController],
  );

  const { ltvs } = useLTVs(paprController, activeVaults, maxLTV);

  const avgLtv = useMemo(() => {
    const ltvValues = Object.values(ltvs);

    if (ltvValues.length === 0) {
      return 0;
    }
    return ltvValues.reduce((a, b) => a + b) / ltvValues.length;
  }, [ltvs]);

  const formattedAvgLtv = useMemo(() => formatPercent(avgLtv), [avgLtv]);

  const formattedTotalDebt = useMemo(() => {
    const debtBigNum = activeVaults.reduce(
      (prev, v) => prev.add(v.debt),
      ethers.BigNumber.from(0),
    );
    const debtNum = parseFloat(
      ethers.utils.formatUnits(debtBigNum, paprController.underlying.decimals),
    );
    return '$' + formatTokenAmount(debtNum);
  }, [activeVaults, paprController.underlying]);

  const formattedDebts = useMemo(() => {
    const decimals = paprController.underlying.decimals;
    const debts = activeVaults.map(
      (v) =>
        '$' +
        formatTokenAmount(
          parseFloat(ethers.utils.formatUnits(v.debt, decimals)),
        ),
    );
    const longestDebt = debts.reduce((prev, curr) =>
      prev.length > curr.length ? prev : curr,
    );
    return debts.map((d) => d.padStart(longestDebt.length, ' '));
  }, [activeVaults, paprController.underlying.decimals]);

  return (
    <Fieldset legend="💸 Loans">
      <Table className={styles.table} fixed>
        <thead>
          <tr>
            <th>Total</th>
            <th>Amount</th>
            <th>Avg.LTV</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.row}>
            <td>{activeVaults.length} Loans</td>
            <td>{formattedTotalDebt}</td>
            <td>{formattedAvgLtv}</td>
            <td>{!!maxLTV && <VaultHealth ltv={avgLtv} maxLtv={maxLTV} />}</td>
          </tr>
        </tbody>
      </Table>
      <Table className={styles.table} fixed>
        <thead>
          <tr>
            <th>Loan</th>
            <th>Amount</th>
            <th>LTV</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody>
          {activeVaults.map((v, i) => {
            const ltv = ltvs ? ltvs[v.id] : 0;
            const formattedDebt = formattedDebts[i];
            return (
              <VaultRow
                key={v.account}
                id={v.id}
                account={v.account}
                debt={formattedDebt}
                controllerId={paprController.id}
                ltv={ltv}
                maxLTV={maxLTV}
              />
            );
          })}
        </tbody>
      </Table>
    </Fieldset>
  );
}
