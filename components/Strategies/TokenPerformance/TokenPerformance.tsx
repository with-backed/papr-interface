import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { LendingStrategy } from 'lib/LendingStrategy';
import {
  formatThreeFractionDigits,
  formatTokenAmount,
  formatPercent,
  formatPercentChange,
} from 'lib/numberFormat';
import { StrategyPricesData } from 'lib/strategies/charts';
import React, { useMemo } from 'react';

import styles from './TokenPerformance.module.css';
import { TooltipReference, useTooltipState } from 'reakit';
import {
  ContractAPRTooltip,
  MarketPriceTooltip,
  NFTCapTooltip,
  RealizedAPRTooltip,
  TargetMarketTooltip,
} from 'components/Strategies/TokenPerformance/Tooltips';
import {
  percentChangeOverDuration,
  getValueDaysAgo,
  percentChange,
} from 'lib/tokenPerformance';

export type StrategySummaryProps = {
  strategies: LendingStrategy[];
  pricesData: { [key: string]: StrategyPricesData | null };
};

export function TokenPerformance({
  strategies,
  pricesData,
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
};
function SummaryEntry({ strategy, pricesData }: SummaryEntryProps) {
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
    return percentChangeOverDuration(pricesData.normalizationValues, 1);
  }, [pricesData]);
  const realizedAPR = useMemo(() => {
    if (!pricesData) {
      return null;
    }
    return percentChangeOverDuration(pricesData.normalizationValues, 30);
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
    const targetOverMarkADayAgo = normADayAgo / markADayAgo;
    const change = percentChange(targetOverMarkADayAgo, targetOverMark);
    return { targetOverMark, change };
  }, [markAndChange, pricesData]);

  const marketPriceTooltip = useTooltipState({ placement: 'bottom-start' });
  const targetMarketTooltip = useTooltipState({ placement: 'bottom-start' });
  const contractAPRTooltip = useTooltipState({ placement: 'bottom-start' });
  const realizedAPRTooltip = useTooltipState({ placement: 'bottom-start' });
  const nftOverCapTooltip = useTooltipState({ placement: 'bottom-start' });

  if (!pricesData) return <></>;

  const debtTokenMarketCap =
    parseFloat(ethers.utils.formatEther(debtTokenSupply || 0)) *
    markAndChange!.mark;

  const nftOverCap = strategyNFTValue / debtTokenMarketCap;

  return (
    <tr>
      <td>
        <div>
          <TooltipReference {...marketPriceTooltip}>
            <span>
              {markAndChange ? formatTokenAmount(markAndChange.mark) : '...'}
            </span>
            <span
              className={
                (markAndChange?.change || 0) < 0
                  ? styles.negative
                  : styles.positive
              }>
              {markAndChange
                ? formatPercentChange(markAndChange.change)
                : '...'}
            </span>
          </TooltipReference>
          <MarketPriceTooltip tooltip={marketPriceTooltip} />
        </div>
      </td>
      <td>
        <TooltipReference {...targetMarketTooltip}>
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
        </TooltipReference>
        <TargetMarketTooltip tooltip={targetMarketTooltip} />
      </td>
      <td>
        <TooltipReference {...contractAPRTooltip}>
          {contractAPR ? formatPercent(contractAPR) : '...'}
        </TooltipReference>
        <ContractAPRTooltip tooltip={contractAPRTooltip} />
      </td>
      <td>
        <TooltipReference {...realizedAPRTooltip}>
          {realizedAPR ? formatPercent(realizedAPR) : '...'}
        </TooltipReference>
        <RealizedAPRTooltip tooltip={realizedAPRTooltip} />
      </td>
      <td>
        <TooltipReference {...nftOverCapTooltip}>
          {formatThreeFractionDigits(nftOverCap)}
        </TooltipReference>
        <NFTCapTooltip
          tooltip={nftOverCapTooltip}
          debtTokenMarketCap={debtTokenMarketCap}
          nftMarketCap={strategyNFTValue}
        />
      </td>
    </tr>
  );
}
