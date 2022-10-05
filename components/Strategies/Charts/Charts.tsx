import { Fieldset } from 'components/Fieldset';
import { StrategyPricesData } from 'lib/strategies/charts';
import React, { useEffect, useMemo, useRef } from 'react';
import styles from './Charts.module.css';
import dynamic from 'next/dynamic';
import { createChart, LineStyle, UTCTimestamp } from 'lightweight-charts';

// apexcharts uses `window`, so will break if we SSR
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

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

const baseOptions = {
  chart: {
    animations: {
      enabled: false,
    },
    background: '#ffffff',
    toolbar: {
      show: false,
    },
  },
  xaxis: {
    type: 'datetime',
    labels: {
      formatter: function (_value: any, timestamp: any, opts: any) {
        return opts.dateFormatter(new Date(timestamp * 1000), 'dd MMM');
      },
      style: {
        cssClass: styles['chart-label'],
      },
    },
  },
  yaxis: {
    labels: {
      show: false,
    },
  },
  colors: ['#007155', '#000000', '#000000'],
  stroke: {
    width: [3, 3, 3],
    curve: 'smooth',
    dashArray: [0, 4, 0],
  },
};

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
});

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
  const options = {
    ...baseOptions,
  };

  const series = useMemo(
    () => [
      {
        name: 'Contract',
        data: normalizationDPRValues.map(([_, timestamp], i) => ({
          x: timestamp,
          y: parseFloat(normalizationValues[i]),
        })),
      },
      {
        name: 'Target',
        data: indexDPRValues.map(([_, timestamp]) => ({
          x: timestamp,
          y: index,
        })),
      },
      {
        name: 'Market',
        data: markDPRValues.map(([_, timestamp], i) => ({
          x: timestamp,
          y: markValues[i],
        })),
      },
    ],
    [
      index,
      indexDPRValues,
      markDPRValues,
      markValues,
      normalizationDPRValues,
      normalizationValues,
    ],
  );

  return (
    <Chart options={options as any} series={series} type="line" width="580" />
  );
}

export default Charts;
