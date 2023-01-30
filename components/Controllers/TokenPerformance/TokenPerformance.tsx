import {
  ContractAPRTooltip,
  MarketPriceTooltip,
  NFTCapTooltip,
  RealizedAPRTooltip,
  TargetMarketTooltip,
} from 'components/Controllers/TokenPerformance/Tooltips';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { useController } from 'hooks/useController';
import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { SECONDS_IN_A_DAY, SECONDS_IN_A_YEAR } from 'lib/constants';
import { controllerNFTValue } from 'lib/controllers';
import {
  formatPercent,
  formatPercentChange,
  formatThreeFractionDigits,
  formatTokenAmount,
} from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import {
  getValueDaysAgo,
  percentChange,
  percentChangeOverDuration,
} from 'lib/tokenPerformance';
import React, { useMemo } from 'react';
import { TooltipReference, useTooltipState } from 'reakit';

import styles from './TokenPerformance.module.css';

export function TokenPerformance() {
  return (
    <Fieldset legend="📈 Token Performance">
      <div className={styles.controllers}>
        <Table className={styles.table}>
          <thead>
            <tr>
              <th>
                MARKET
                <br />
                PRICE
              </th>
              <th>
                TARGET/
                <br />
                MARKET
              </th>
              <th>
                CONTRACT
                <br />
                APR
              </th>
              <th>
                REALIZED
                <br />
                APR (30d)
              </th>
              <th>
                NFT/
                <br />
                CAP
              </th>
            </tr>
          </thead>
          <tbody>
            <SummaryEntry />
          </tbody>
        </Table>
      </div>
    </Fieldset>
  );
}

function SummaryEntry() {
  const { pricesData } = useControllerPricesData();
  const controller = useController();
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const NFTValue = useMemo(
    () => controllerNFTValue(controller, oracleInfo),
    [controller, oracleInfo],
  );
  const contractAPR = useMemo(() => {
    if (!pricesData) {
      return null;
    }
    const l = pricesData.targetValues.length;
    const cur = pricesData.targetValues[l - 1];
    const prev = pricesData.targetValues[l - 2];
    const change = percentChange(prev.value, cur.value);
    // convert to APR
    return (change / (cur.time - prev.time)) * SECONDS_IN_A_YEAR;
  }, [pricesData]);
  const realizedAPR = useMemo(() => {
    if (!pricesData) {
      return null;
    }
    const change = percentChangeOverDuration(pricesData.markValues, 30);
    /// convert to APR
    return (change / (SECONDS_IN_A_DAY * 30)) * SECONDS_IN_A_YEAR;
  }, [pricesData]);
  const markAndChange = useMemo(() => {
    if (!pricesData) {
      return null;
    }
    const { markValues, targetValues } = pricesData;
    // This happens on a brand new controller that doesn't have data yet.
    if (markValues.length === 0 || targetValues.length === 0) {
      return {
        mark: 0,
        target: 0,
        change: 0,
      };
    }
    const mark = markValues[markValues.length - 1].value;
    const target = targetValues[targetValues.length - 1].value;
    const valueADayAgo = getValueDaysAgo(markValues, 1).value;
    const change = percentChange(valueADayAgo, mark);
    return { mark, target, change };
  }, [pricesData]);
  const targetOverMarketAndChange = useMemo(() => {
    if (!pricesData || !markAndChange) {
      return null;
    }
    const { markValues, targetValues } = pricesData;
    // This happens on a brand new controller that doesn't have data yet.
    if (markValues.length === 0 || targetValues.length === 0) {
      return {
        targetOverMark: 0,
        change: 0,
      };
    }
    const { mark } = markAndChange;
    const norm = targetValues[targetValues.length - 1].value;
    const normADayAgo = getValueDaysAgo(targetValues, 1).value;
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
        <TargetMarketTooltip
          tooltip={targetMarketTooltip}
          mark={markAndChange?.mark}
          target={markAndChange?.target}
          underlyingSymbol={controller.underlying.symbol}
        />
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
        <TooltipReference {...nftOverCapTooltip}>???</TooltipReference>
        <NFTCapTooltip
          tooltip={nftOverCapTooltip}
          debtTokenMarketCap={0}
          nftMarketCap={NFTValue}
          paprSymbol={controller.paprToken.symbol}
        />
      </td>
    </tr>
  );
}
