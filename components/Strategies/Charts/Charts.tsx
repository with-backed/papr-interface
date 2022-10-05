import { Fieldset } from 'components/Fieldset';
import { StrategyPricesData } from 'lib/strategies/charts';
import React, { useEffect, useRef } from 'react';
import styles from './Charts.module.css';
import { createChart, LineStyle, UTCTimestamp } from 'lightweight-charts';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';

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
      <h3 className={styles.header}>Price in USDC</h3>
      <PriceInUSDC pricesData={pricesData} />
      <h3 className={styles.header}>Rate of Growth</h3>
      <RateOfGrowth pricesData={pricesData} />
    </Fieldset>
  );
}

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
        height: 360,
        grid: { horzLines: { visible: false } },
        layout: { textColor: '#ffffff' },
        localization: {
          priceFormatter: (value: string) =>
            formatPercent(parseFloat(value) / 100),
        },
      });
      chart
        .priceScale()
        .applyOptions({ drawTicks: false, borderVisible: false });
      chart.timeScale().applyOptions({
        visible: false,
      });
      const indexSeries = chart.addLineSeries({
        lineStyle: LineStyle.SparseDotted,
        color: '#000000',
        priceLineVisible: false,
      });
      indexSeries.setData(
        indexDPRValues.map(([value, timestamp]) => ({
          time: timestamp as UTCTimestamp,
          value,
        })),
      );

      const markSeries = chart.addLineSeries({
        color: '#007155',
        priceLineVisible: false,
      });
      markSeries.setData(
        markDPRValues.map(([value, timestamp]) => ({
          time: timestamp as UTCTimestamp,
          value,
        })),
      );

      const normSeries = chart.addLineSeries({
        color: '#000000',
        priceLineVisible: false,
      });
      normSeries.setData(
        normalizationDPRValues.map(([value, timestamp]) => ({
          time: timestamp as UTCTimestamp,
          value,
        })),
      );

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
        height: 360,
        grid: { horzLines: { visible: false } },
        layout: { textColor: '#ffffff' },
        localization: {
          priceFormatter: (value: string) =>
            formatTokenAmount(parseFloat(value)) + ' USDC',
        },
      });
      chart
        .priceScale()
        .applyOptions({ drawTicks: false, borderVisible: false });
      chart.timeScale().applyOptions({
        visible: false,
      });
      const indexSeries = chart.addLineSeries({
        lineStyle: LineStyle.SparseDotted,
        color: '#000000',
        priceLineVisible: false,
      });
      indexSeries.setData(
        indexDPRValues.map(([_, timestamp]) => ({
          time: timestamp as UTCTimestamp,
          value: index,
        })),
      );

      const markSeries = chart.addLineSeries({
        color: '#007155',
        priceLineVisible: false,
      });
      markSeries.setData(
        markDPRValues.map(([_, timestamp], i) => ({
          time: timestamp as UTCTimestamp,
          value: markValues[i],
        })),
      );

      const normSeries = chart.addLineSeries({
        color: '#000000',
        priceLineVisible: false,
      });
      normSeries.setData(
        normalizationDPRValues.map(([_, timestamp], i) => ({
          time: timestamp as UTCTimestamp,
          value: parseFloat(normalizationValues[i]),
        })),
      );

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
