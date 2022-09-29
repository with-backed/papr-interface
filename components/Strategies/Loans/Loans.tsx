import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { timestampDaysAgo } from 'lib/duration';
import { LendingStrategy } from 'lib/LendingStrategy';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { convertOneScaledValue } from 'lib/strategies';
import { StrategyPricesData } from 'lib/strategies/charts';
import React, { useEffect, useMemo, useState } from 'react';
import {
  DebtIncreasesByVaultDocument,
  DebtIncreasesByVaultQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import { Health } from '../Health';
import styles from './Loans.module.css';

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
      const l = ltv(v.debt, v.totalCollateralValue, norm);
      return { ...prev, [v.id]: convertOneScaledValue(l, 4) };
    }, {} as { [key: string]: number });
    setLtvs(calculatedLtvs);
  }, [activeVaults, norm]);

  return (
    <Fieldset legend="💸 Loans">
      <table className={styles.table}>
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
      </table>
      <table className={styles.table}>
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
                decimals={lendingStrategy.underlying.decimals}
                symbol={lendingStrategy.underlying.symbol}
                ltv={ltv}
                maxLTV={maxLTV}
              />
            );
          })}
        </tbody>
      </table>
    </Fieldset>
  );
}

type VaultRowProps = {
  id: string;
  debt: ethers.BigNumberish;
  decimals: ethers.BigNumberish;
  symbol: string;
  ltv?: number;
  maxLTV: ethers.BigNumber | null;
};
function VaultRow({ id, debt, decimals, symbol, ltv, maxLTV }: VaultRowProps) {
  const [{ data }] = useQuery<DebtIncreasesByVaultQuery>({
    query: DebtIncreasesByVaultDocument,
    variables: { vaultId: id },
  });

  const createdTimestamp = useMemo(() => {
    if (!data?.debtIncreasedEvents) {
      return undefined;
    }

    return data.debtIncreasedEvents.reduce((prev, e) =>
      prev.timestamp < e.timestamp ? prev : e,
    ).timestamp;
  }, [data]);

  const formattedDebt = useMemo(() => {
    const debtNum = parseFloat(ethers.utils.formatUnits(debt, decimals));
    return formatTokenAmount(debtNum) + ` ${symbol}`;
  }, [debt, decimals, symbol]);

  return (
    <tr className={styles.row}>
      <td>#{id.substring(0, 7)}</td>
      <td className={styles['right-align']}>{formattedDebt}</td>
      <td className={styles['right-align']}>
        {!!createdTimestamp ? timestampDaysAgo(createdTimestamp) : '...'}
      </td>
      <td className={styles['right-align']}>
        {ltv ? formatPercent(ltv) : '...'}
      </td>
      <td className={styles['center-align']}>
        {!!ltv && !!maxLTV ? <VaultHealth ltv={ltv} maxLtv={maxLTV} /> : '...'}
      </td>
    </tr>
  );
}

function ltv(
  debt: ethers.BigNumberish,
  totalCollateralValue: ethers.BigNumberish,
  norm: ethers.BigNumberish,
) {
  const valueNormRatio = ethers.BigNumber.from(totalCollateralValue).div(norm);
  return ethers.BigNumber.from(debt).div(valueNormRatio);
}

type VaultHealthProps = {
  ltv: number;
  maxLtv: ethers.BigNumber;
};
function VaultHealth({ ltv, maxLtv }: VaultHealthProps) {
  const maxLTV = convertOneScaledValue(maxLtv, 4);
  const ratio = ltv / maxLTV;

  const indicator = useMemo(() => {
    // Ratio, but as a number out of 10 rather than a decimal out of 1
    const numHashes = Math.round(ratio * 10);
    const dashes = Array(10).fill('-');
    const hashes = Array(numHashes).fill('#');
    return hashes.concat(dashes).join('').substring(0, 10);
  }, [ratio]);

  return (
    <span
      className={ratio > 0.5 ? styles['indicator-danger'] : styles.indicator}>
      {indicator}
    </span>
  );
}
