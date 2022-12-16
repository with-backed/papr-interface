import {
  ContractAPRTooltip,
  MarketPriceTooltip,
  NFTCapTooltip,
  RealizedAPRTooltip,
  TargetMarketTooltip,
} from 'components/Controllers/TokenPerformance/Tooltips';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { SECONDS_IN_A_DAY, SECONDS_IN_A_YEAR } from 'lib/constants';
import { ControllerPricesData } from 'lib/controllers/charts';
import {
  formatPercent,
  formatPercentChange,
  formatThreeFractionDigits,
  formatTokenAmount,
} from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { PaprController } from 'lib/PaprController';
import {
  getValueDaysAgo,
  percentChange,
  percentChangeOverDuration,
} from 'lib/tokenPerformance';
import React, { useMemo } from 'react';
import { TooltipReference, useTooltipState } from 'reakit';

import styles from './TokenPerformance.module.css';

export type ControllerSummaryProps = {
  controllers: PaprController[];
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
  controller: PaprController;
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
  const controllerNFTValue = useMemo(() => {
    if (!controller.vaults || controller.vaults.length === 0 || !oracleInfo)
      return 0;
    return controller.vaults
      .map((v) => v.collateral)
      .flat()
      .map((collateral) => collateral.contractAddress)
      .map((collection) => oracleInfo[collection].price)
      .reduce((a, b) => a + b, 0);
  }, [controller, oracleInfo]);
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

  const nftOverCap = controllerNFTValue / debtTokenMarketCap;

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
          nftMarketCap={controllerNFTValue}
          paprSymbol={controller.debtToken.symbol}
        />
      </td>
    </tr>
  );
}
