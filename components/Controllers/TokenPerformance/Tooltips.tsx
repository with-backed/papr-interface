import { useAsyncValue } from 'hooks/useAsyncValue';
import { PaprController } from 'lib/PaprController';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { ControllerPricesData } from 'lib/controllers/charts';
import { useMemo } from 'react';
import { TooltipStateReturn } from 'reakit';
import styles from 'components/Controllers/TokenPerformance/tooltips.module.css';
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

export function TargetMarketTooltip({
  tooltip,
  mark,
  target,
  underlyingSymbol,
}: TooltipProps & {
  mark?: number;
  target?: number;
  underlyingSymbol: string;
}) {
  return (
    <Tooltip {...tooltip}>
      <div className={styles.tooltip}>
        “Target” is the papr contract’s internal valuation of papr, which
        incorporates interest payments in response to the Market price.
      </div>
      <div className={styles.nftCapTooltip}>
        <p className={styles.value}>
          {mark?.toFixed(2)} {underlyingSymbol}
        </p>
        <p className={styles.description}>Mark</p>
        <p className={styles.value}>
          {target?.toFixed(2)} {underlyingSymbol}
        </p>
        <p className={styles.description}>Target</p>
      </div>
    </Tooltip>
  );
}

export function ContractAPRTooltip({ tooltip }: TooltipProps) {
  return (
    <Tooltip {...tooltip}>
      <div className={styles.tooltip}>
        This is the effective interest rate the contract is charging to
        borrowers, measured by the rate of increase in the contract&apos;s
        target valuation of papr, which is used in assessing loan values and
        liquidations.
      </div>
    </Tooltip>
  );
}

export function RealizedAPRTooltip({ tooltip }: TooltipProps) {
  return (
    <Tooltip {...tooltip}>
      <div className={styles.tooltip}>
        Change in the market price of papr over the last 30 days, expressed as
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
  paprSymbol,
}: TooltipProps & {
  debtTokenMarketCap: number;
  nftMarketCap: number;
  paprSymbol: string;
}) {
  return (
    <Tooltip {...tooltip}>
      <div className={styles.nftCapTooltip}>
        <p className={styles.value}>${formatTokenAmount(nftMarketCap)}</p>
        <p className={styles.description}>
          (NFT) Floor value of all deposited collateral
        </p>
        <p className={styles.value}>${formatTokenAmount(debtTokenMarketCap)}</p>
        <p className={styles.description}>(CAP) Market value of {paprSymbol}</p>
        <p className={styles.value}>
          {(nftMarketCap / debtTokenMarketCap).toFixed(2)}
        </p>
        <p className={styles.description}>Ratio of collateral to debt</p>
      </div>
    </Tooltip>
  );
}
