import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { timestampDaysAgo } from 'lib/duration';
import { PaprController } from 'lib/PaprController';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { computeLtv, convertOneScaledValue } from 'lib/controllers';
import { ControllerPricesData } from 'lib/controllers/charts';
import React, { useEffect, useMemo, useState } from 'react';
import { Health } from '../Health';
import styles from './Loans.module.css';
import { VaultRow } from './VaultRow';
import { Table } from 'components/Table';

type LoansProps = {
  paprController: PaprController;
  pricesData: ControllerPricesData | null;
};

export function Loans({ paprController, pricesData }: LoansProps) {
  const [ltvs, setLtvs] = useState<{ [key: string]: number }>({});
  const norm = useAsyncValue(
    () => paprController.newTarget(),
    [paprController],
  );
  const maxLTV = useAsyncValue(() => paprController.maxLTV(), [paprController]);
  const activeVaults = useMemo(
    () => paprController.vaults?.filter((v) => v.debt > 0) || [],
    [paprController],
  );
  const avgLtv = useMemo(() => {
    const ltvValues = Object.values(ltvs);

    if (ltvValues.length === 0) {
      return '...';
    }

    return formatPercent(ltvValues.reduce((a, b) => a + b) / ltvValues.length);
  }, [ltvs]);

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

  useEffect(() => {
    if (!norm) {
      return;
    }
    const calculatedLtvs = activeVaults.reduce((prev, v) => {
      // TODO fix after we decide how get up to date oracle quote
      const l = computeLtv(v.debt, 1, norm);
      return { ...prev, [v.id]: convertOneScaledValue(l, 4) };
    }, {} as { [key: string]: number });
    setLtvs(calculatedLtvs);
  }, [activeVaults, norm]);

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
            <th>Days</th>
            <th>Avg.LTV</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.row}>
            <td>{activeVaults.length} Loans</td>
            <td>{formattedTotalDebt}</td>
            <td>{timestampDaysAgo(paprController.createdAt)}</td>
            <td>{avgLtv}</td>
            <td>{!!pricesData ? <Health pricesData={pricesData} /> : '???'}</td>
          </tr>
        </tbody>
      </Table>
      <Table className={styles.table} fixed>
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
          {activeVaults.map((v, i) => {
            const ltv = ltvs[v.id];
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
