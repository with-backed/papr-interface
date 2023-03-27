import { Tooltip, TooltipReference as TTR } from 'components/Tooltip';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useOracleInfo } from 'hooks/useOracleInfo';
import { useTarget } from 'hooks/useTarget';
import { SECONDS_IN_A_YEAR } from 'lib/constants';
import {
  formatPercent,
  formatPercentChange,
  formatTokenAmount,
} from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { percentChange } from 'lib/tokenPerformance';
import { useMemo } from 'react';
import { useTooltipState } from 'reakit/Tooltip';

import styles from './VaultDebtExplainer.module.css';

type VaultDebtExplainerProps = {
  maxLTV: number;
  maxDebt: number;
  chosenDebt: number;
  collateralCount: number;
  collateralContractAddress: string;
};

export function VaultDebtExplainer({
  chosenDebt,
  maxDebt,
  maxLTV,
  collateralCount,
  collateralContractAddress,
}: VaultDebtExplainerProps) {
  const { paprToken, underlying, currentTarget, currentTargetUpdated } =
    useController();
  const newTargetResult = useTarget();
  const targetYesterday = useTarget('yesterday');
  const currentLTVTooltip = useTooltipState();
  const accruingInterestTooltip = useTooltipState();
  const nftValueTooltip = useTooltipState();
  const oracleInfo = useOracleInfo(OraclePriceType.twap);

  const chosenLTV = useMemo(
    () => Math.min((chosenDebt / maxDebt) * maxLTV, maxLTV),
    [chosenDebt, maxDebt, maxLTV],
  );

  const underlyingSymbol = useMemo(
    () => (underlying.symbol === 'WETH' ? 'ETH' : underlying.symbol),
    [underlying],
  );

  const newTargetNumber = useMemo(
    () =>
      newTargetResult
        ? parseFloat(
            ethers.utils.formatUnits(
              newTargetResult.target,
              paprToken.decimals,
            ),
          )
        : null,
    [paprToken, newTargetResult],
  );

  const debtNow = useMemo(
    () => (newTargetNumber ? chosenDebt * newTargetNumber : 0),
    [chosenDebt, newTargetNumber],
  );

  const debtYesterday = useMemo(
    () =>
      targetYesterday
        ? chosenDebt *
          parseFloat(
            ethers.utils.formatUnits(
              targetYesterday.target,
              paprToken.decimals,
            ),
          )
        : 0,
    [chosenDebt, paprToken, targetYesterday],
  );

  const formattedDebtNow = useMemo(
    () =>
      debtNow > 0 ? `${formatTokenAmount(debtNow)} ${underlyingSymbol}` : '...',
    [debtNow, underlyingSymbol],
  );

  const debtPercentChange = useMemo(
    () => formatPercentChange(percentChange(debtYesterday, debtNow)),
    [debtNow, debtYesterday],
  );

  const collateralValue = useMemo(() => {
    if (oracleInfo && oracleInfo[collateralContractAddress]) {
      const collectionPrice = oracleInfo[collateralContractAddress].price;
      return `${formatTokenAmount(
        collectionPrice * collateralCount,
      )} ${underlyingSymbol}`;
    }
    return '...';
  }, [
    collateralContractAddress,
    collateralCount,
    oracleInfo,
    underlyingSymbol,
  ]);

  const liquidationTriggerPrice = useMemo(() => {
    if (!newTargetNumber) {
      return '...';
    }
    const amount = (chosenDebt * newTargetNumber) / maxLTV;
    return `${formatTokenAmount(amount)} ${underlyingSymbol}`;
  }, [chosenDebt, maxLTV, newTargetNumber, underlyingSymbol]);

  const currentTargetNumber = useMemo(() => {
    return parseFloat(
      ethers.utils.formatUnits(currentTarget, underlying.decimals),
    );
  }, [currentTarget, underlying.decimals]);

  const contractAPR = useMemo(() => {
    if (!newTargetResult || !newTargetNumber) {
      return null;
    }
    const change = percentChange(currentTargetNumber, newTargetNumber);
    // convert to APR
    return (
      (change / (newTargetResult.timestamp - currentTargetUpdated)) *
      SECONDS_IN_A_YEAR
    );
  }, [
    newTargetNumber,
    currentTargetUpdated,
    currentTargetNumber,
    newTargetResult,
  ]);

  const daysToLiquidation = useMemo(() => {
    if (
      oracleInfo &&
      oracleInfo[collateralContractAddress] &&
      newTargetNumber &&
      contractAPR
    ) {
      const collectionPrice = oracleInfo[collateralContractAddress].price;
      const collateralValue = collectionPrice * collateralCount;
      const hypotheticalTarget = (collateralValue * maxLTV) / chosenDebt;
      const percentDiff =
        (hypotheticalTarget - newTargetNumber) / newTargetNumber;
      const yearsToLiquidation = dayjs.duration({
        years: percentDiff / contractAPR,
      });
      return yearsToLiquidation.asDays();
    }

    return null;
  }, [
    chosenDebt,
    collateralContractAddress,
    collateralCount,
    contractAPR,
    maxLTV,
    oracleInfo,
    newTargetNumber,
  ]);

  return (
    <>
      <p>
        Loan liquidates when <TTR {...currentLTVTooltip}>Current LTV</TTR> (
        {formatPercent(chosenLTV)}) reaches Max LTV ({formatPercent(maxLTV)}).
        This can happen by{' '}
        <TTR {...accruingInterestTooltip}>accruing interest</TTR> or by a drop
        in <TTR {...nftValueTooltip}>NFT value</TTR>.
      </p>

      <Tooltip {...currentLTVTooltip}>
        <div className={styles['three-column-tooltip']}>
          <span>Loan to Value (LTV) calculation</span>
          <span></span>
          <span>Δ 24hr</span>

          <span>L = (papr borrowed x Target Price)</span>
          <span>{formattedDebtNow}</span>
          <span>({debtPercentChange})</span>

          <span>V = (7-day avg. top bid)</span>
          <span>{collateralValue}</span>
          {/* We don't yet have data to compute percent change for this */}
          <span></span>
        </div>
      </Tooltip>

      <Tooltip {...accruingInterestTooltip}>
        {daysToLiquidationMessage(daysToLiquidation)}
      </Tooltip>

      <Tooltip {...nftValueTooltip}>
        If contract&apos;s valuation of the collateral drops to{' '}
        {liquidationTriggerPrice} or below, this loan will be liquidated at
        auction to cover the debt.
      </Tooltip>
    </>
  );
}

function daysToLiquidationMessage(daysToLiquidation: number | null) {
  if (daysToLiquidation === null) {
    return '...';
  }
  return daysToLiquidation <= 0
    ? 'The current interest rate is negative, and is not currently moving this loan closer to liquidation.'
    : `Assuming today's interest rate and NFT price, interest charges will result in liquidation after ${daysToLiquidation} days.`;
}
