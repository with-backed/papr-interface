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
  const norm = useAsyncValue(() => paprController.newNorm(), [paprController]);
  const maxLTV = useAsyncValue(() => paprController.maxLTV(), [paprController]);
  const activeVaults = useMemo(
    () =>
      paprController.vaults?.filter((v) => v.totalCollateralValue > 0) || [],
    [paprController],
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
      ethers.utils.formatUnits(debtBigNum, paprController.underlying.decimals),
    );
    return formatTokenAmount(debtNum) + ` ${paprController.underlying.symbol}`;
  }, [activeVaults, paprController.underlying]);

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
      <Table className={styles.table} fixed>
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
              {timestampDaysAgo(paprController.createdAt)}
            </td>
            <td className={styles['right-align']}>{avgLtv}</td>
            <td className={styles['center-align']}>
              {!!pricesData ? <Health pricesData={pricesData} /> : '???'}
            </td>
          </tr>
        </tbody>
      </Table>
      <Table className={styles.table} fixed>
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
                controllerId={paprController.id}
                decimals={paprController.underlying.decimals}
                symbol={paprController.underlying.symbol}
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
