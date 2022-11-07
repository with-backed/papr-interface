import { useAsyncValue } from 'hooks/useAsyncValue';
import { LendingStrategy } from 'lib/LendingStrategy';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { StrategyPricesData } from 'lib/strategies/charts';
import { useMemo } from 'react';
import { TooltipStateReturn } from 'reakit';
import styles from 'components/Strategies/TokenPerformance/tooltips.module.css';
import { Tooltip } from 'components/Tooltip';

export type TooltipProps = {
  tooltip: TooltipStateReturn;
};

export function MarketPriceTooltip({ tooltip }: TooltipProps) {
  return (
    <Tooltip {...tooltip}>
      <div className={styles.tooltip}>
        paprMEME trades on the open market via a Uniswap pool where it is paired
        with USDC
      </div>
    </Tooltip>
  );
}

export function TargetMarketTooltip({ tooltip }: TooltipProps) {
  return (
    <Tooltip {...tooltip}>
      <div className={styles.tooltip}>
        “Target” is the papr contract’s internal valuation of papr, which
        incorporates interest payments in response to the Market price. When
        this ratio ratio is below 1, the contract is trying to slow the growth
        of papr.
      </div>
    </Tooltip>
  );
}

export function ContractAPRTooltip({ tooltip }: TooltipProps) {
  return (
    <Tooltip {...tooltip}>
      <div className={styles.tooltip}>
        This is interest rate the contract is currently charging to borrowers,
        measured by the current rate of increase in the contract’s “Target”
        valuation of papr, which is used in assessing loan values and
        liquidations.
      </div>
    </Tooltip>
  );
}

export function RealizedAPRTooltip({ tooltip }: TooltipProps) {
  return (
    <Tooltip {...tooltip}>
      <div className={styles.tooltip}>
        Increase in the market price of papr over the last 30 days, expressed as
        the annualized return an investor would realize if they bought and held
        papr.
      </div>
    </Tooltip>
  );
}

export function NFTCapTooltip({
  tooltip,
  debtTokenMarketCap,
  nftMarketCap,
}: TooltipProps & { debtTokenMarketCap: number; nftMarketCap: number }) {
  return (
    <Tooltip {...tooltip}>
      <div className={styles.nftCapTooltip}>
        <div className={styles.value}>
          <p>${formatTokenAmount(nftMarketCap)}</p>
        </div>
        <div className={styles.description}>
          <p>(NFT) Floor value of all deposited collateral</p>
        </div>
        <div className={styles.value}>
          <p>${formatTokenAmount(debtTokenMarketCap)}</p>
        </div>
        <div className={styles.description}>
          <p>(CAP) Market value of strategy&apos;s pAPR tokens</p>
        </div>
        <div className={styles.value}>
          <p>{(nftMarketCap / debtTokenMarketCap).toFixed(2)}</p>
        </div>
        <div className={styles.description}>
          <p>Ratio of collateral to debt</p>
        </div>
      </div>
    </Tooltip>
  );
}
