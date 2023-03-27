import { Tooltip, TooltipReference as TTR } from 'components/Tooltip';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useOracleInfo } from 'hooks/useOracleInfo';
import { useTarget } from 'hooks/useTarget';
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
  const { paprToken, underlying } = useController();
  const targetNow = useTarget();
  const targetYesterday = useTarget('yesterday');
  const currentLTVTooltip = useTooltipState();
  const accruingInterestTooltip = useTooltipState();
  const nftValueTooltip = useTooltipState();
  const oracleInfo = useOracleInfo(OraclePriceType.twap);

  const chosenLTV = useMemo(
    () => Math.min((chosenDebt / maxDebt) * maxLTV, maxLTV),
    [chosenDebt, maxDebt, maxLTV],
  );

  const debtNow = useMemo(
    () =>
      targetNow
        ? chosenDebt *
          parseFloat(
            ethers.utils.formatUnits(targetNow.target, paprToken.decimals),
          )
        : 0,
    [chosenDebt, paprToken, targetNow],
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
      debtNow > 0
        ? `${formatTokenAmount(debtNow)} ${underlying.symbol}`
        : '...',
    [debtNow, underlying],
  );

  const debtPercentChange = useMemo(
    () => formatPercentChange(percentChange(debtYesterday, debtNow)),
    [debtNow, debtYesterday],
  );

  const collateralValue = useMemo(() => {
    if (oracleInfo && oracleInfo[collateralContractAddress]) {
      const collectionPrice = oracleInfo[collateralContractAddress].price;
      return `${formatTokenAmount(collectionPrice * collateralCount)} ${
        underlying.symbol
      }`;
    }
    return '...';
  }, [collateralContractAddress, collateralCount, oracleInfo, underlying]);

  // placeholder variables (will become props/calculations)
  const daysToLiquidation = 199;
  const liquidationTriggerPrice = '0.455 ETH';

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
        {daysToLiquidation === 0
          ? 'The current interest rate is negative, and is not currently moving this loan closer to liquidation.'
          : `Assuming today's interest rate and NFT price, interest charges will result in liquidation after ${daysToLiquidation} days.`}
      </Tooltip>

      <Tooltip {...nftValueTooltip}>
        If contract&apos;s valuation of the collateral drops below{' '}
        {liquidationTriggerPrice}, this loan will be liquidated at auction to
        cover the debt.
      </Tooltip>
    </>
  );
}
