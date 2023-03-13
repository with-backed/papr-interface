import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { TargetUpdate, useTarget } from 'hooks/useTarget';
import { SupportedToken } from 'lib/config';
import { SECONDS_IN_A_YEAR } from 'lib/constants';
import { computeNewProjectedAPR } from 'lib/controllers';
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
  paprPrice: number | null;
}

export function ImpactProjection({ paprPrice }: ImpactProjectionProps) {
  const newTargetUpdate = useTarget();
  const currentMarket = useLatestMarketPrice();
  if (paprPrice === null) {
    return <ImpactProjectionLoading />;
  }

  if (!newTargetUpdate || !currentMarket) {
    return <ImpactProjectionPricesLoading />;
  }

  return (
    <ImpactProjectionLoaded
      paprPrice={paprPrice}
      newTargetUpdate={newTargetUpdate}
      currentMarket={currentMarket}
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

interface ImpactProjectionLoadedProps {
  paprPrice: number;
  newTargetUpdate: TargetUpdate;
  currentMarket: number;
}
function ImpactProjectionLoaded({
  paprPrice,
  newTargetUpdate,
  currentMarket,
}: ImpactProjectionLoadedProps) {
  const { tokenName } = useConfig();
  const { fundingPeriod, underlying, currentTarget, currentTargetUpdated } =
    useController();
  const [projectedData, setProjectedData] = useState<{
    newApr: number;
    newTarget: number;
  } | null>(null);

  const currentTargetNumber = useMemo(() => {
    return parseFloat(
      ethers.utils.formatUnits(currentTarget, underlying.decimals),
    );
  }, [currentTarget, underlying.decimals]);

  const newTargetNumber = useMemo(() => {
    return parseFloat(
      ethers.utils.formatUnits(newTargetUpdate.newTarget, underlying.decimals),
    );
  }, [newTargetUpdate, underlying.decimals]);

  const currentAPR = useMemo(() => {
    return (
      (percentChange(currentTargetNumber, newTargetNumber) /
        (newTargetUpdate.timestamp - currentTargetUpdated)) *
      SECONDS_IN_A_YEAR
    );
  }, [
    currentTargetNumber,
    newTargetNumber,
    currentTargetUpdated,
    newTargetUpdate.timestamp,
  ]);

  useEffect(() => {
    setProjectedData(
      computeNewProjectedAPR(
        paprPrice,
        newTargetNumber,
        600 /* 10 minutes */,
        ethers.BigNumber.from(fundingPeriod),
        tokenName as SupportedToken,
      ),
    );
  }, [newTargetNumber, paprPrice, fundingPeriod, tokenName]);

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
            currentMarket > currentTargetNumber
              ? styles['pointers']
              : styles['pointers-reverse']
          }>
          <PriceProjection
            kind="market"
            currentPrice={currentMarket}
            newPrice={paprPrice}
          />
          <PriceProjection
            kind="target"
            currentPrice={newTargetNumber}
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
