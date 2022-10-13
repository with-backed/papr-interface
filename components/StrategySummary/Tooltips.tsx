import { useAsyncValue } from 'hooks/useAsyncValue';
import { LendingStrategy } from 'lib/LendingStrategy';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { StrategyPricesData } from 'lib/strategies/charts';
import { useMemo } from 'react';
import { TooltipStateReturn } from 'reakit';
import styles from './tooltips.module.css';
import { Tooltip } from 'components/Tooltip';

export type ToolkitProps = {
  strategy: LendingStrategy;
  tooltip: TooltipStateReturn;
};

export function TokenTooltip({ strategy, tooltip }: ToolkitProps) {
  const maxLTVPercent = useAsyncValue(
    () => strategy.maxLTVPercent(),
    [strategy],
  );
  const formattedMaxLTVPercent = useMemo(() => {
    if (maxLTVPercent) {
      return formatPercent(maxLTVPercent);
    }
    return '---';
  }, [maxLTVPercent]);
  return (
    <Tooltip {...tooltip}>
      <div className={styles.tooltip}>
        This lending strategy lends to Cryptopunks, lending up to{' '}
        {formattedMaxLTVPercent} of the value of the Punks floor.
        {/* todo think of new design for max borrowable information now that strategy is multi collateral */}
      </div>
    </Tooltip>
  );
}

/// TODO leaving refeactor until design decides new strategy summary design
export function APRTooltip({ strategy, tooltip }: ToolkitProps) {
  return (
    <Tooltip {...tooltip}>
      The strategy contract adjusts the (C) contract rate for minting and
      liquidation, targeting steady growth of 0% per year.
    </Tooltip>
  );
}

export function NFTCapTooltip({
  strategy,
  tooltip,
  debtTokenMarketCap,
  nftMarketCap,
}: ToolkitProps & { debtTokenMarketCap: number; nftMarketCap: number }) {
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

export function MktCtrTooltip({
  tooltip,
  strategy,
  mark,
  norm,
}: ToolkitProps & { mark: number; norm: number }) {
  const markOverNorm = mark / norm;
  const diff = markOverNorm > 1 ? markOverNorm - 1 : 1 - markOverNorm;
  const lowerHigherText = markOverNorm > 1 ? 'higher' : 'lower';
  const speedText = markOverNorm > 1 ? 'slow' : 'accelerate';
  return (
    <Tooltip {...tooltip}>
      <div className={styles.mktCtrTooltip}>
        <div className={styles.grid}>
          <div>
            <p>(MKT) Market price:</p>
          </div>
          <div>
            <p>
              {formatTokenAmount(mark)} {strategy.underlying.symbol}
            </p>
          </div>
          <div>
            <p>(CTR) Contract price:</p>
          </div>
          <div>
            <p>
              {formatTokenAmount(norm)} {strategy.underlying.symbol}
            </p>
          </div>
          <div>
            <p>Difference ratio:</p>
          </div>
          <div>
            <p>{(mark / norm).toFixed(2)}</p>
          </div>
        </div>
        <div>
          <p>
            The market price is {formatPercent(diff)} {lowerHigherText} than the
            price used by the contract, which is used to balance borrow and
            lender demand.
          </p>
        </div>
      </div>
    </Tooltip>
  );
}

export function RateTooltip({
  tooltip,
  pricesData,
}: ToolkitProps & {
  pricesData: StrategyPricesData;
}) {
  const targetDaily = pricesData.indexDPR;
  const targetYearly = targetDaily * 365;

  const realizedDaily =
    pricesData.markDPRValues[pricesData.markDPRValues.length - 1].value;
  const realizedYearly = realizedDaily * 365;

  const contractDaily =
    pricesData.normalizationDPRValues[
      pricesData.normalizationDPRValues.length - 1
    ].value;
  const contractYearly = contractDaily * 365;

  return (
    <Tooltip {...tooltip}>
      <div className={styles.rateTooltip}>
        <div>
          <p>Strategy targets: {formatPercent(targetYearly)} APR</p>
        </div>
        <div>
          <p>= {formatPercent(pricesData.indexDPR)} daily</p>
        </div>
        <div>
          <p>(R) Realized rate: {formatPercent(realizedYearly)} APR</p>
        </div>
        <div>
          <p>= {formatPercent(realizedDaily)} daily</p>
        </div>
        <div>
          <p>(C) Contract rate: {formatPercent(contractYearly)} APR</p>
        </div>
        <div>
          <p>= {formatPercent(contractDaily)} daily</p>
        </div>
      </div>
    </Tooltip>
  );
}
