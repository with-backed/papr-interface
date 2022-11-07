import { Fieldset } from 'components/Fieldset';
import { StrategyPricesData, TimeSeriesValue } from 'lib/strategies/charts';
import React, { useEffect, useMemo, useRef } from 'react';
import styles from './Charts.module.css';
import {
  ChartOptions,
  createChart,
  DeepPartial,
  LineSeriesOptions,
  PriceScaleOptions,
  TimeScaleOptions,
} from 'lightweight-charts';
import { percentChangeOverDuration, percentChange } from 'lib/tokenPerformance';
import { formatPercentChange } from 'lib/numberFormat';

const APR_COLOR = '#0000ee';
const PRICE_COLOR = '#FF659C';

type ChartsProps = {
  pricesData: StrategyPricesData | null;
};

export function Charts({ pricesData }: ChartsProps) {
  if (!pricesData) {
    return (
      <Fieldset legend="💸 Performance">No price data available...</Fieldset>
    );
  }

  return (
    <Fieldset legend="💸 Performance">
      <RateOfGrowth pricesData={pricesData} />
    </Fieldset>
  );
}

const BASE_TIME_SCALE_OPTIONS: DeepPartial<TimeScaleOptions> = {
  visible: true,
  tickMarkFormatter: () => '',
};
const BASE_LINE_SERIES_OPTIONS: DeepPartial<LineSeriesOptions> = {
  priceLineVisible: false,
  lineWidth: 2,
};
const BASE_PRICE_SCALE_OPTIONS: DeepPartial<PriceScaleOptions> = {
  borderVisible: false,
  visible: true,
};
const BASE_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  height: 360,
  width: 500,
  grid: { horzLines: { visible: false }, vertLines: { visible: false } },
  rightPriceScale: {
    ...BASE_PRICE_SCALE_OPTIONS,
    scaleMargins: {
      top: 0.499,
      bottom: 0.499,
    },
  },
  leftPriceScale: {
    ...BASE_PRICE_SCALE_OPTIONS,
  },
  layout: {
    textColor: 'black',
    fontFamily: "'GT Maru Regular', Helvetica, sans-serif",
    fontSize: 12,
  },
};

type RateOfGrowthProps = {
  pricesData: StrategyPricesData;
};
function RateOfGrowth({
  pricesData: { markValues, normalizationValues },
}: RateOfGrowthProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const contractAPRs: TimeSeriesValue[] = useMemo(
    () =>
      normalizationValues.slice(1).map((curr, i) => {
        const prev = normalizationValues[i];
        // lightweight-charts expects percentages as the actual value, not a ratio
        const change = percentChange(prev.value, curr.value) * 100;
        return { value: change, time: curr.time };
      }),
    [normalizationValues],
  );

  const priceChange24h = useMemo(
    () => percentChangeOverDuration(markValues, 1),
    [markValues],
  );
  const contractAPRChange24h = useMemo(
    () => percentChangeOverDuration(contractAPRs, 1),
    [contractAPRs],
  );

  useEffect(() => {
    if (chartRef.current) {
      const chart = createChart(chartRef.current, {
        ...BASE_CHART_OPTIONS,
      });
      chart.timeScale().applyOptions({ ...BASE_TIME_SCALE_OPTIONS });

      const contractAPRSeries = chart.addLineSeries({
        ...BASE_LINE_SERIES_OPTIONS,
        color: APR_COLOR,
        priceFormat: { type: 'percent' },
      });
      contractAPRSeries.setData(contractAPRs);

      const priceSeries = chart.addLineSeries({
        ...BASE_LINE_SERIES_OPTIONS,
        color: PRICE_COLOR,
        priceFormat: { type: 'price', minMove: 0.001, precision: 3 },
        priceScaleId: 'left',
      });
      priceSeries.setData(markValues);

      chart.timeScale().fitContent();

      return () => chart.remove();
    }
  }, [contractAPRs, markValues]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        <span className={styles['price-label']}>papr price in USDC</span>{' '}
      </div>
      <div className={styles.chart} ref={chartRef} />
      <div className={styles.label}>
        <span className={styles['apr-label']}>Contract APR</span>{' '}
      </div>
    </div>
  );
}

export default Charts;
