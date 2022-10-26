import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { LendingStrategy } from 'lib/LendingStrategy';
import {
  formatThreeFractionDigits,
  formatTokenAmount,
  formatPercent,
  formatPercentChange,
} from 'lib/numberFormat';
import { StrategyPricesData, TimeSeriesValue } from 'lib/strategies/charts';
import React, { useMemo } from 'react';

import styles from './TokenPerformance.module.css';
import { getTimestampNDaysAgo } from 'lib/duration';

export type StrategySummaryProps = {
  strategies: LendingStrategy[];
  pricesData: { [key: string]: StrategyPricesData | null };
  includeDetails: boolean;
};

export function TokenPerformance({
  strategies,
  pricesData,
  includeDetails,
}: StrategySummaryProps) {
  return (
    <Fieldset legend="📈 Token Performance">
      <div className={styles.strategies}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                Market
                <br />
                Price
              </th>
              <th>
                Target/
                <br />
                Market
              </th>
              <th>
                Contract
                <br />
                APR
              </th>
              <th>
                Realized
                <br />
                APR (30d)
              </th>
              <th>
                NFT/
                <br />
                Cap
              </th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((strategy, i) => (
              <SummaryEntry
                key={strategy.id}
                pricesData={pricesData[strategy.id]}
                strategy={strategy}
                includeDetails={includeDetails}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Fieldset>
  );
}

type SummaryEntryProps = {
  pricesData: StrategyPricesData | null;
  strategy: LendingStrategy;
  includeDetails?: boolean;
};
function SummaryEntry({
  strategy,
  pricesData,
  includeDetails,
}: SummaryEntryProps) {
  const { network } = useConfig();
  const debtTokenSupply = useAsyncValue(
    () =>
      strategy.token0IsUnderlying
        ? strategy.token1.totalSupply()
        : strategy.token0.totalSupply(),
    [strategy],
  );
  const strategyNFTValue = useMemo(() => {
    if (!strategy.vaults || strategy.vaults.length === 0) return 0;
    return strategy.vaults
      .map((v) => v.collateral)
      .flat()
      .map((collateral) => collateral.contractAddress)
      .map((collection) => strategy.oracleInfo[getAddress(collection)].price)
      .reduce((a, b) => a + b, 0);
  }, [strategy]);
  const contractAPR = useMemo(() => {
    if (!pricesData) {
      return null;
    }
    return deriveAPR(pricesData.normalizationValues, 1);
  }, [pricesData]);
  const realizedAPR = useMemo(() => {
    if (!pricesData) {
      return null;
    }
    return deriveAPR(pricesData.normalizationValues, 30);
  }, [pricesData]);
  const markAndChange = useMemo(() => {
    if (!pricesData) {
      return null;
    }
    const { markValues } = pricesData;
    const mark = markValues[markValues.length - 1].value;
    const valueADayAgo = getValueDaysAgo(markValues, 1).value;
    const change = percentChange(valueADayAgo, mark);
    return { mark, change };
  }, [pricesData]);
  const targetOverMarketAndChange = useMemo(() => {
    if (!pricesData || !markAndChange) {
      return null;
    }
    const { markValues, normalizationValues } = pricesData;
    const { mark } = markAndChange;
    const norm = normalizationValues[normalizationValues.length - 1].value;
    const normADayAgo = getValueDaysAgo(normalizationValues, 1).value;
    const markADayAgo = getValueDaysAgo(markValues, 1).value;

    const targetOverMark = norm / mark;
    const targetOverMarkADayAgo = normADayAgo - markADayAgo;
    const change = percentChange(targetOverMarkADayAgo, targetOverMark);
    return { targetOverMark, change };
  }, [markAndChange, pricesData]);

  if (!pricesData) return <></>;

  const debtTokenMarketCap =
    parseFloat(ethers.utils.formatEther(debtTokenSupply || 0)) *
    markAndChange!.mark;

  const nftOverCap = strategyNFTValue / debtTokenMarketCap;

  return (
    <tr>
      <td>
        <div>
          <span>
            {markAndChange ? formatTokenAmount(markAndChange.mark) : '...'}
          </span>
          <span
            className={
              (markAndChange?.change || 0) < 0
                ? styles.negative
                : styles.positive
            }>
            {markAndChange ? formatPercentChange(markAndChange.change) : '...'}
          </span>
        </div>
      </td>
      <td>
        <div>
          <span>
            {targetOverMarketAndChange
              ? formatThreeFractionDigits(
                  targetOverMarketAndChange.targetOverMark,
                )
              : '...'}
          </span>
          <span
            className={
              (targetOverMarketAndChange?.change || 0) < 0
                ? styles.negative
                : styles.positive
            }>
            {targetOverMarketAndChange
              ? formatPercentChange(targetOverMarketAndChange.change)
              : '...'}
          </span>
        </div>
      </td>
      <td>{contractAPR ? formatPercent(contractAPR) : '...'}</td>
      <td>{realizedAPR ? formatPercent(realizedAPR) : '...'}</td>
      <td>{formatThreeFractionDigits(nftOverCap)}</td>
    </tr>
  );
}

function percentChange(v1: number, v2: number) {
  return (v2 - v1) / v1;
}

function getValueDaysAgo(values: TimeSeriesValue[], daysAgo: number) {
  const pastTimestamp = getTimestampNDaysAgo(daysAgo);
  return values.reduce((prev, curr) => {
    const prevDiff = Math.abs(pastTimestamp - prev.time);
    const currDiff = Math.abs(pastTimestamp - curr.time);
    if (currDiff < prevDiff) {
      return curr;
    }
    return prev;
  }, values[0]);
}

function deriveAPR(
  normalizationValues: TimeSeriesValue[],
  durationDays: number,
) {
  const v1 = getValueDaysAgo(normalizationValues, durationDays);
  const v2 = normalizationValues[normalizationValues.length - 1];
  return percentChange(v1.value, v2.value);
}
