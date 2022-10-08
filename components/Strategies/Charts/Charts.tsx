import { Fieldset } from 'components/Fieldset';
import { StrategyPricesData } from 'lib/strategies/charts';
import React, { useEffect, useRef } from 'react';
import styles from './Charts.module.css';
import {
  ChartOptions,
  createChart,
  DeepPartial,
  LineSeriesOptions,
  LineStyle,
  PriceScaleOptions,
  TimeScaleOptions,
  UTCTimestamp,
} from 'lightweight-charts';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';

const INDEX_COLOR = '#000000';
const NORM_COLOR = '#007155';
const MARK_COLOR = '#0000ee';

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
      <Legend />
      <h3 className={styles.header}>Price in USDC</h3>
      <PriceInUSDC pricesData={pricesData} />
      <h3 className={styles.header}>Rate of Growth</h3>
      <RateOfGrowth pricesData={pricesData} />
    </Fieldset>
  );
}

function Legend() {
  return (
    <div className={styles.legend}>
      <LegendItem title={'target'} color={INDEX_COLOR} />
      <LegendItem title={'c_pAPR'} color={NORM_COLOR} />
      <LegendItem title={'pAPR'} color={MARK_COLOR} />
    </div>
  );
}

function LegendItem({ title, color }: { title: string; color: string }) {
  return (
    <div className={styles.legendItem}>
      <div
        className={styles.legendSquare}
        style={{ backgroundColor: color }}></div>
      <p> {title} </p>
    </div>
  );
}

const BASE_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  height: 360,
  grid: { horzLines: { visible: false } },
  layout: {
    textColor: '#ffffff',
    fontFamily: "'GT Maru Regular', Helvetica, sans-serif",
    fontSize: 12,
  },
};
const BASE_PRICE_SCALE_OPTIONS: DeepPartial<PriceScaleOptions> = {
  drawTicks: false,
  borderVisible: false,
};
const BASE_TIME_SCALE_OPTIONS: DeepPartial<TimeScaleOptions> = {
  visible: false,
};
const BASE_LINE_SERIES_OPTIONS: DeepPartial<LineSeriesOptions> = {
  priceLineVisible: false,
  lineWidth: 3,
};

type RateOfGrowthProps = {
  pricesData: StrategyPricesData;
};
function RateOfGrowth({
  pricesData: { normalizationDPRValues, indexDPRValues, markDPRValues },
}: RateOfGrowthProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const chart = createChart(chartRef.current, {
        ...BASE_CHART_OPTIONS,
        localization: {
          priceFormatter: (value: string) => formatPercent(parseFloat(value)),
        },
      });
      chart.priceScale().applyOptions({ ...BASE_PRICE_SCALE_OPTIONS });
      chart.timeScale().applyOptions({ ...BASE_TIME_SCALE_OPTIONS });
      const indexSeries = chart.addLineSeries({
        ...BASE_LINE_SERIES_OPTIONS,
        lineStyle: LineStyle.SparseDotted,
        color: INDEX_COLOR,
      });
      indexSeries.setData(indexDPRValues);

      const markSeries = chart.addLineSeries({
        ...BASE_LINE_SERIES_OPTIONS,
        color: MARK_COLOR,
      });
      markSeries.setData(markDPRValues);

      const normSeries = chart.addLineSeries({
        ...BASE_LINE_SERIES_OPTIONS,
        color: NORM_COLOR,
      });
      normSeries.setData(normalizationDPRValues);

      chart.timeScale().fitContent();

      return () => chart.remove();
    }
  }, [indexDPRValues, markDPRValues, normalizationDPRValues]);

  return <div ref={chartRef} />;
}

type PriceInUSDCProps = {
  pricesData: StrategyPricesData;
};
function PriceInUSDC({
  pricesData: {
    normalizationDPRValues,
    normalizationValues,
    indexDPRValues,
    index,
    markDPRValues,
    markValues,
  },
}: PriceInUSDCProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const chart = createChart(chartRef.current, {
        ...BASE_CHART_OPTIONS,
        localization: {
          priceFormatter: (value: string) =>
            formatTokenAmount(parseFloat(value)) + ' USDC',
        },
      });
      chart.priceScale().applyOptions({ ...BASE_PRICE_SCALE_OPTIONS });
      chart.timeScale().applyOptions({ ...BASE_TIME_SCALE_OPTIONS });
      const indexSeries = chart.addLineSeries({
        ...BASE_LINE_SERIES_OPTIONS,
        lineStyle: LineStyle.SparseDotted,
        color: INDEX_COLOR,
      });

      indexSeries.setData(
        indexDPRValues.map(({ time }) => ({
          time,
          value: index,
        })),
      );

      const markSeries = chart.addLineSeries({
        ...BASE_LINE_SERIES_OPTIONS,
        color: MARK_COLOR,
      });
      markSeries.setData(markValues);

      const normSeries = chart.addLineSeries({
        ...BASE_LINE_SERIES_OPTIONS,
        color: NORM_COLOR,
      });
      normSeries.setData(normalizationValues);

      chart.timeScale().fitContent();

      return () => chart.remove();
    }
  }, [
    index,
    indexDPRValues,
    markDPRValues,
    markValues,
    normalizationDPRValues,
    normalizationValues,
  ]);

  return <div ref={chartRef} />;
}

export default Charts;
