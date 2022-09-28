import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { timestampDaysAgo } from 'lib/duration';
import { LendingStrategy } from 'lib/LendingStrategy';
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

const formatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 2,
});

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

    return formatter.format(
      ltvValues.reduce((a, b) => a + b) / ltvValues.length,
    );
  }, [ltvs]);

  const totalDebt = useMemo(
    () =>
      activeVaults.reduce(
        (prev, v) => prev.add(v.debt),
        ethers.BigNumber.from(0),
      ),
    [activeVaults],
  );

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
            <td className={styles['right-align']}>
              {ethers.utils.formatUnits(
                totalDebt,
                lendingStrategy.underlying.decimals,
              )}{' '}
              {lendingStrategy.underlying.symbol}
            </td>
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
  const [{ data, fetching }] = useQuery<DebtIncreasesByVaultQuery>({
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

  return (
    <tr className={styles.row}>
      <td>#{id.substring(0, 7)}</td>
      <td className={styles['right-align']}>
        {ethers.utils.formatUnits(debt, decimals)} {symbol}
      </td>
      <td className={styles['right-align']}>
        {!!createdTimestamp ? timestampDaysAgo(createdTimestamp) : '...'}
      </td>
      <td className={styles['right-align']}>
        {ltv ? formatter.format(ltv) : '...'}
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
