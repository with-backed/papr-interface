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
        <div className={styles.value}>
          <p>
            {mark?.toFixed(2)} {underlyingSymbol}
          </p>
        </div>
        <div className={styles.description}>
          <p>Mark</p>
        </div>
        <div className={styles.value}>
          <p>
            {target?.toFixed(2)} {underlyingSymbol}
          </p>
        </div>
        <div className={styles.description}>
          <p>Target</p>
        </div>
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
          <p>(CAP) Market value of {paprSymbol}</p>
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
