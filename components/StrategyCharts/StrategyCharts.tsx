import { Fieldset } from 'components/Fieldset';
import { StrategyPricesData } from 'lib/strategies/charts';
import React, { useMemo } from 'react';
import styles from './StrategyCharts.module.css';
import dynamic from 'next/dynamic';

// apexcharts uses `window`, so will break if we SSR
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type StrategyChartsProps = {
  pricesData: StrategyPricesData;
};

export function StrategyCharts({ pricesData }: StrategyChartsProps) {
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

type RateOfGrowthProps = StrategyChartsProps;
function RateOfGrowth({
  pricesData: { normalizationDPRValues, indexDPRValues, markDPRValues },
}: RateOfGrowthProps) {
  const options = {
    ...baseOptions,
    tooltip: {
      y: {
        show: true,
        formatter: function (val: number) {
          return percentFormatter.format(val);
        },
      },
    },
  };

  const series = useMemo(
    () => [
      {
        name: 'Contract',
        data: normalizationDPRValues.map(([value, timestamp]) => ({
          x: timestamp,
          y: value,
        })),
      },
      {
        name: 'Target',
        data: indexDPRValues.map(([value, timestamp]) => ({
          x: timestamp,
          y: value,
        })),
      },
      {
        name: 'Market',
        data: markDPRValues.map(([value, timestamp]) => ({
          x: timestamp,
          y: value,
        })),
      },
    ],
    [indexDPRValues, markDPRValues, normalizationDPRValues],
  );

  return (
    <Chart options={options as any} series={series} type="line" width="580" />
  );
}

type PriceInUSDCProps = StrategyChartsProps;
function PriceInUSDC({
  pricesData: {
    normalizationDPRValues,
    normalizationValues,
    index,
    markDPRValues,
    markValues,
  },
}: PriceInUSDCProps) {
  const options = {
    ...baseOptions,
  };

  // each unique timestamp from the datasets, sorted ascending. Use this to
  // make sure we have an index entry for each other value
  const timestamps = useMemo(
    () =>
      Array.from(
        new Set([
          ...markDPRValues.map(([_, timestamp]) => timestamp),
          ...normalizationDPRValues.map(([_, timestamp]) => timestamp),
        ]),
      ).sort((a, b) => a - b),
    [markDPRValues, normalizationDPRValues],
  );

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
        data: timestamps.map((timestamp) => ({
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
      markDPRValues,
      markValues,
      normalizationDPRValues,
      normalizationValues,
      timestamps,
    ],
  );

  return (
    <Chart options={options as any} series={series} type="line" width="580" />
  );
}
