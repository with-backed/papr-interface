import { Fieldset } from 'components/Fieldset';
import { useConfig } from 'hooks/useConfig';
import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { SupportedToken } from 'lib/config';
import { SECONDS_IN_A_YEAR } from 'lib/constants';
import { computeNewProjectedAPR } from 'lib/controllers';
import { ControllerPricesData } from 'lib/controllers/charts';
import {
  formatPercent,
  formatPercentChange,
  formatTokenAmount,
} from 'lib/numberFormat';
import { percentChange } from 'lib/tokenPerformance';
import { useEffect, useMemo, useState } from 'react';

import styles from './ImpactProjection.module.css';

const LEGEND = '🔮 Impact Projection';

interface ImpactProjectionProps {
  marketPriceImpact: number | null;
}

export function ImpactProjection({ marketPriceImpact }: ImpactProjectionProps) {
  const { pricesData, fetching, error } = useControllerPricesData();
  if (marketPriceImpact === null) {
    return <ImpactProjectionLoading />;
  }

  if (fetching) {
    return <ImpactProjectionPricesLoading />;
  }

  if (error) {
    return <ImpactProjectionPricesError />;
  }

  return (
    <ImpactProjectionLoaded
      marketPriceImpact={marketPriceImpact}
      pricesData={pricesData}
    />
  );
}

function ImpactProjectionLoading() {
  return (
    <Fieldset legend={LEGEND}>
      Waiting on impact info from swap widget.
    </Fieldset>
  );
}
function ImpactProjectionPricesLoading() {
  return <Fieldset legend={LEGEND}>Waiting on protocol price data.</Fieldset>;
}
function ImpactProjectionPricesError() {
  return (
    <Fieldset legend={LEGEND}>
      Error fetching protocol price data; cannot compute impact.
    </Fieldset>
  );
}

interface ImpactProjectionLoadedProps {
  marketPriceImpact: number;
  pricesData: ControllerPricesData;
}
function ImpactProjectionLoaded({
  marketPriceImpact,
  pricesData,
}: ImpactProjectionLoadedProps) {
  const { tokenName } = useConfig();
  const { targetValues, markValues } = pricesData;
  const currentTarget = targetValues[targetValues.length - 1].value;
  const currentMarket = markValues[markValues.length - 1].value;
  const [projectedData, setProjectedData] = useState<{
    newApr: number;
    newTarget: number;
  } | null>(null);

  const newMark = useMemo(
    () => currentMarket * marketPriceImpact,
    [currentMarket, marketPriceImpact],
  );

  const currentAPR = useMemo(() => {
    const current = targetValues[targetValues.length - 1];
    const previous = targetValues[targetValues.length - 2];
    return (
      (percentChange(previous.value, current.value) /
        (current.time - previous.time)) *
      SECONDS_IN_A_YEAR
    );
  }, [targetValues]);

  useEffect(() => {
    computeNewProjectedAPR(
      newMark,
      currentTarget,
      600 /* 10 minutes */,
      tokenName as SupportedToken,
    ).then(setProjectedData);
  }, [currentTarget, newMark, tokenName]);

  const aprProjectionClassName = useMemo(() => {
    if (projectedData) {
      if (projectedData.newApr < currentAPR) {
        return [styles.negative, styles.right].join(' ');
      } else if (projectedData.newApr >= currentAPR) {
        return [styles.positive, styles.right].join(' ');
      }
    }
    return undefined;
  }, [currentAPR, projectedData]);

  const direction = useMemo(() => {
    if (!projectedData) {
      return 'down';
    }
    return currentAPR > projectedData.newApr ? 'down' : 'up';
  }, [currentAPR, projectedData]);

  return (
    <Fieldset legend={LEGEND}>
      <p>
        Interest rate updates lag swaps due to the use of time-weighted values.
        Rates are modeled as if the price after the swap were to hold for 10
        minutes.
      </p>
      <div className={styles['projection-wrapper']}>
        <div className={aprProjectionClassName}>
          Projected
          <br />
          Rate
          <br />
          {projectedData?.newApr ? formatPercent(projectedData.newApr) : '---'}
        </div>
        <Direction direction={direction} />
        <div className={styles.right}>
          Contract
          <br />
          Rate
          <br />
          {formatPercent(currentAPR)}
        </div>
        <Separator />
        <div
          className={
            currentMarket > currentTarget
              ? styles['pointers']
              : styles['pointer-reverse']
          }>
          <PriceProjection
            kind="market"
            currentPrice={currentMarket}
            newPrice={newMark}
          />
          <PriceProjection
            kind="target"
            currentPrice={currentTarget}
            newPrice={projectedData?.newTarget || null}
          />
        </div>
      </div>
    </Fieldset>
  );
}

function Separator() {
  return (
    <div className={styles.separator}>
      <span>·</span>
      <span>·</span>
      <span>·</span>
      <span className={styles.pipe}>|</span>
      <span className={styles.pipe}>|</span>
      <span className={styles.pipe}>|</span>
      <span className={styles.pipe}>|</span>
      <span className={styles.pipe}>|</span>
      <span>·</span>
      <span>·</span>
      <span>·</span>
    </div>
  );
}

interface DirectionProps {
  direction: 'up' | 'down';
}
function Direction({ direction }: DirectionProps) {
  const symbol = useMemo(() => (direction === 'down' ? 'v' : '^'), [direction]);
  return (
    <div className={styles.direction}>
      <span>{symbol}</span>
      <span>{symbol}</span>
      <span>{symbol}</span>
    </div>
  );
}

interface PriceProjectionProps {
  currentPrice: number;
  newPrice: number | null;
  kind: 'market' | 'target';
}
function PriceProjection({
  currentPrice,
  newPrice,
  kind,
}: PriceProjectionProps) {
  const formattedPrice = useMemo(
    () => formatTokenAmount(currentPrice),
    [currentPrice],
  );

  const formattedNewPrice = useMemo(
    () => (newPrice ? formatTokenAmount(newPrice) : '---'),
    [newPrice],
  );

  const change = useMemo(
    () => (newPrice ? percentChange(currentPrice, newPrice) : 0),
    [currentPrice, newPrice],
  );

  return (
    <div>
      <div className={styles['pointer-wrapper']}>
        <span className={styles['pointer-arrow']}>&lt;</span>
        <span>
          {kind.charAt(0).toUpperCase() + kind.slice(1)} Price
          <br />
          {formattedPrice}
        </span>
      </div>
      <div className={styles[change < 0 ? 'negative' : 'positive']}>
        Projected:
        <br />
        {formattedNewPrice} ({formatPercentChange(change)})
      </div>
    </div>
  );
}
