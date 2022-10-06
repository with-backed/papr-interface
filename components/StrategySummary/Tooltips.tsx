import { useAsyncValue } from 'hooks/useAsyncValue';
import { LendingStrategy } from 'lib/LendingStrategy';
import { StrategyPricesData } from 'lib/strategies/charts';
import { PRICE } from 'lib/strategies/constants';
import { Tooltip, TooltipStateReturn } from 'reakit';
import styles from './tooltips.module.css';

export type ToolkitProps = {
  strategy: LendingStrategy;
  tooltip: TooltipStateReturn;
};

export function TokenTooltip({ strategy, tooltip }: ToolkitProps) {
  const maxLTVPercent = useAsyncValue(
    () => strategy.maxLTVPercent(),
    [strategy],
  );
  return (
    <Tooltip {...tooltip}>
      <div className={styles.tooltip}>
        This lending strategy lends to Cryptopunks, lending up to{' '}
        {maxLTVPercent}% of the value of the Punks floor. The oracle price for
        Cryptopunks is ${PRICE}. The max loan value is {maxLTVPercent}% of that:
        ${((PRICE * (maxLTVPercent || 0)) / 100).toFixed(2)}
      </div>
    </Tooltip>
  );
}

export function APRTooltip({ strategy, tooltip }: ToolkitProps) {
  const targetAnnualGrowthPercent = useAsyncValue(
    () => strategy.targetAnnualGrowthPercent(),
    [strategy],
  );
  return (
    <Tooltip {...tooltip}>
      <div className={styles.tooltip}>
        The strategy contract adjusts the (C) contract rate for minting and
        liquidation, targeting steady growth of {targetAnnualGrowthPercent}% per
        year.
      </div>
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
      <div className={`${styles.tooltip} ${styles.nftCapTooltip}`}>
        <div className={styles.value}>
          <p>${nftMarketCap}</p>
        </div>
        <div className={styles.description}>
          <p>(NFT) Floor value of all deposited collateral</p>
        </div>
        <div className={styles.value}>
          <p>${debtTokenMarketCap}</p>
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
  const targetAnnualGrowthPercent = useAsyncValue(
    () => strategy.targetAnnualGrowthPercent(),
    [strategy],
  );
  return (
    <Tooltip {...tooltip}>
      <div className={`${styles.tooltip} ${styles.mktCtrTooltip}`}>
        <div className={styles.grid}>
          <div>
            <p>(MKT) Market price:</p>
          </div>
          <div>
            <p>
              ${mark.toFixed(2)} {strategy.underlying.symbol}
            </p>
          </div>
          <div>
            <p>(CTR) Contract price:</p>
          </div>
          <div>
            <p>
              ${norm.toFixed(2)} {strategy.underlying.symbol}
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
            The market price is {(diff * 100).toFixed(0)}% {lowerHigherText}{' '}
            than the price used by the contract, which is aiming to {speedText}{' '}
            the growth rate (target is {targetAnnualGrowthPercent}% APR).
          </p>
        </div>
      </div>
    </Tooltip>
  );
}

export function RateTooltip({
  tooltip,
  pricesData,
}: ToolkitProps & { pricesData: StrategyPricesData }) {
  const targetDaily = pricesData.indexDPR;
  const targetYearly = targetDaily * 365;

  const realizedDaily =
    pricesData.markDPRValues[pricesData.markDPRValues.length - 1][0];
  const realizedYearly = realizedDaily * 365;

  const contractDaily =
    pricesData.normalizationDPRValues[
      pricesData.normalizationDPRValues.length - 1
    ][0];
  const contractYearly = contractDaily * 365;

  return (
    <Tooltip {...tooltip}>
      <div className={`${styles.tooltip} ${styles.rateTooltip}`}>
        <div>
          <p>Strategy targets: {targetYearly.toFixed(0)}% APR</p>
        </div>
        <div>
          <p>= {pricesData.indexDPR.toFixed(2)}% daily</p>
        </div>
        <div>
          <p>(R) Realized rate: {realizedYearly.toFixed(0)}% APR</p>
        </div>
        <div>
          <p>= {realizedDaily.toFixed(2)}% daily</p>
        </div>
        <div>
          <p>(C) Contract rate: {contractYearly.toFixed(0)}% APR</p>
        </div>
        <div>
          <p>= {contractDaily.toFixed(2)}% daily</p>
        </div>
      </div>
    </Tooltip>
  );
}
