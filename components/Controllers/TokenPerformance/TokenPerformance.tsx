import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { PaprController } from 'lib/PaprController';
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
  const debtTokenSupply = useAsyncValue(
    () =>
      controller.token0IsUnderlying
        ? controller.token1.totalSupply()
        : controller.token0.totalSupply(),
    [controller],
  );
  const controllerNFTValue = useMemo(() => {
    if (!controller.vaults || controller.vaults.length === 0) return 0;
    return controller.vaults
      .map((v) => v.collateral)
      .flat()
      .map((collateral) => collateral.contractAddress)
      .map((collection) => controller.oracleInfo[getAddress(collection)].price)
      .reduce((a, b) => a + b, 0);
  }, [controller]);
  const contractAPR = useMemo(() => {
    if (!pricesData) {
      return null;
    }
    return percentChangeOverDuration(pricesData.targetValues, 1);
  }, [pricesData]);
  const realizedAPR = useMemo(() => {
    if (!pricesData) {
      return null;
    }
    return percentChangeOverDuration(pricesData.targetValues, 30);
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
          nftMarketCap={controllerNFTValue}
        />
      </td>
    </tr>
  );
}
