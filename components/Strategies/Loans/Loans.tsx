import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { timestampDaysAgo } from 'lib/duration';
import { LendingStrategy } from 'lib/LendingStrategy';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { computeLtv, convertOneScaledValue } from 'lib/strategies';
import { StrategyPricesData } from 'lib/strategies/charts';
import React, { useEffect, useMemo, useState } from 'react';
import { Health } from '../Health';
import styles from './Loans.module.css';
import { VaultRow } from './VaultRow';
import { Table } from 'components/Table';

type LoansProps = {
  lendingStrategy: LendingStrategy;
  pricesData: StrategyPricesData | null;
};

export function Loans({ lendingStrategy, pricesData }: LoansProps) {
  const [ltvs, setLtvs] = useState<{ [key: string]: number }>({});
  const norm = useAsyncValue(
    () => lendingStrategy.newNorm(),
    [lendingStrategy],
  );
  const maxLTV = useAsyncValue(
    () => lendingStrategy.maxLTV(),
    [lendingStrategy],
  );
  const activeVaults = useMemo(
    () =>
      lendingStrategy.vaults?.filter((v) => v.totalCollateralValue > 0) || [],
    [lendingStrategy],
  );
  const avgLtv = useMemo(() => {
    const ltvValues = Object.values(ltvs);

    if (ltvValues.length === 0) {
      return '...';
    }

    return formatPercent(ltvValues.reduce((a, b) => a + b) / ltvValues.length);
  }, [ltvs]);

  const totalDebt = useMemo(
    () =>
      activeVaults.reduce(
        (prev, v) => prev.add(v.debt),
        ethers.BigNumber.from(0),
      ),
    [activeVaults],
  );

  const formattedTotalDebt = useMemo(() => {
    const debtBigNum = activeVaults.reduce(
      (prev, v) => prev.add(v.debt),
      ethers.BigNumber.from(0),
    );
    const debtNum = parseFloat(
      ethers.utils.formatUnits(debtBigNum, lendingStrategy.underlying.decimals),
    );
    return formatTokenAmount(debtNum) + ` ${lendingStrategy.underlying.symbol}`;
  }, [activeVaults, lendingStrategy.underlying]);

  useEffect(() => {
    if (!norm) {
      return;
    }
    const calculatedLtvs = activeVaults.reduce((prev, v) => {
      const l = computeLtv(v.debt, v.totalCollateralValue, norm);
      return { ...prev, [v.id]: convertOneScaledValue(l, 4) };
    }, {} as { [key: string]: number });
    setLtvs(calculatedLtvs);
  }, [activeVaults, norm]);

  return (
    <Fieldset legend="💸 Loans">
      <Table className={styles.table}>
        <thead>
          <tr>
            <th>Total</th>
            <th className={styles['right-align']}>Amount</th>
            <th className={styles['right-align']}>Days</th>
            <th className={styles['right-align']}>Avg. LTV</th>
            <th className={styles['center-align']}>Health</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.row}>
            <td>{activeVaults.length} Loans</td>
            <td className={styles['right-align']}>{formattedTotalDebt}</td>
            <td className={styles['right-align']}>
              {timestampDaysAgo(lendingStrategy.createdAt)}
            </td>
            <td className={styles['right-align']}>{avgLtv}</td>
            <td className={styles['center-align']}>
              {!!pricesData ? <Health pricesData={pricesData} /> : '???'}
            </td>
          </tr>
        </tbody>
      </Table>
      <Table className={styles.table}>
        <thead>
          <tr>
            <th>Loan</th>
            <th className={styles['right-align']}>Amount</th>
            <th className={styles['right-align']}>Days</th>
            <th className={styles['right-align']}>LTV</th>
            <th className={styles['center-align']}>Health</th>
          </tr>
        </thead>
        <tbody>
          {activeVaults.map((v) => {
            const ltv = ltvs[v.id];
            return (
              <VaultRow
                key={v.id}
                id={v.id}
                debt={v.debt}
                strategyId={lendingStrategy.id}
                decimals={lendingStrategy.underlying.decimals}
                symbol={lendingStrategy.underlying.symbol}
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
