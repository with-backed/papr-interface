import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { PaprController_deprecated } from 'lib/PaprController';
import {
  formatThreeFractionDigits,
  formatTokenAmount,
  formatPercent,
  formatPercentChange,
} from 'lib/numberFormat';
import { ControllerPricesData } from 'lib/controllers/charts';
import React, { useMemo } from 'react';

import styles from './TokenPerformance.module.css';
import { TooltipReference, useTooltipState } from 'reakit';
import {
  ContractAPRTooltip,
  MarketPriceTooltip,
  NFTCapTooltip,
  RealizedAPRTooltip,
  TargetMarketTooltip,
} from 'components/Controllers/TokenPerformance/Tooltips';
import {
  percentChangeOverDuration,
  getValueDaysAgo,
  percentChange,
} from 'lib/tokenPerformance';
import { Table } from 'components/Table';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { SECONDS_IN_A_DAY, SECONDS_IN_A_YEAR } from 'lib/constants';
import { controllerNFTValue } from 'lib/controllers';

export type ControllerSummaryProps = {
  controllers: PaprController_deprecated[];
  pricesData: { [key: string]: ControllerPricesData | null };
};

export function TokenPerformance({
  controllers,
  pricesData,
}: ControllerSummaryProps) {
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
            {controllers.map((controller, i) => (
              <SummaryEntry
                key={controller.id}
                pricesData={pricesData[controller.id]}
                controller={controller}
              />
            ))}
          </tbody>
        </Table>
      </div>
    </Fieldset>
  );
}

type SummaryEntryProps = {
  pricesData: ControllerPricesData | null;
  controller: PaprController_deprecated;
};
function SummaryEntry({ controller, pricesData }: SummaryEntryProps) {
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const debtTokenSupply = useAsyncValue(
    () =>
      controller.token0IsUnderlying
        ? controller.token1.totalSupply()
        : controller.token0.totalSupply(),
    [controller],
  );
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

  const debtTokenMarketCap =
    parseFloat(ethers.utils.formatEther(debtTokenSupply || 0)) *
    markAndChange!.mark;

  const nftOverCap = NFTValue / debtTokenMarketCap;

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
        <TooltipReference {...nftOverCapTooltip}>
          {formatThreeFractionDigits(nftOverCap)}
        </TooltipReference>
        <NFTCapTooltip
          tooltip={nftOverCapTooltip}
          debtTokenMarketCap={debtTokenMarketCap}
          nftMarketCap={NFTValue}
          paprSymbol={controller.debtToken.symbol}
        />
      </td>
    </tr>
  );
}
