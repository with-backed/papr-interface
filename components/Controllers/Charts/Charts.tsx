import { Fieldset } from 'components/Fieldset';
import { useConfig } from 'hooks/useConfig';
import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { useTheme } from 'hooks/useTheme';
import { SECONDS_IN_A_YEAR } from 'lib/constants';
import { ControllerPricesData, TimeSeriesValue } from 'lib/controllers/charts';
import { percentChange } from 'lib/tokenPerformance';
import {
  ChartOptions,
  createChart,
  DeepPartial,
  LineSeriesOptions,
  PriceScaleOptions,
  TimeScaleOptions,
} from 'lightweight-charts';
import React, { useEffect, useMemo, useRef } from 'react';

import styles from './Charts.module.css';

const APR_COLOR = '#0064FA';

export function Charts() {
  const { pricesData } = useControllerPricesData();
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
  },
  leftPriceScale: {
    ...BASE_PRICE_SCALE_OPTIONS,
  },
  layout: {
    textColor: 'black',
    fontFamily: "'Courier Prime', 'Courier New', monospace",
    fontSize: 12,
  },
};

// Not responsive, but at least the default mobile experience will
// not blow the layout.
const SMOL_CHART_OPTIONS = {
  ...BASE_CHART_OPTIONS,
  height: 300,
  width: 320,
};

type RateOfGrowthProps = {
  pricesData: ControllerPricesData;
};
function RateOfGrowth({
  pricesData: { markValues, targetValues },
}: RateOfGrowthProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { tokenName } = useConfig();

  const priceColor = useMemo(() => {
    if (theme === 'hero') {
      return '#908ee7';
    } else if (theme === 'meme') {
      return '#47b79c';
    } else if (theme === 'papr') {
      return '#5397ff';
    } else if (theme === 'trash') {
      return '#ff6333';
    }
  }, [theme]);

  const contractAPRs: TimeSeriesValue[] = useMemo(
    () =>
      targetValues
        .slice(1)
        .map((curr, i) => {
          const prev = targetValues[i];
          // lightweight-charts expects percentages as the actual value, not a ratio
          const change =
            ((percentChange(prev.value, curr.value) * 100) /
              (curr.time - prev.time)) *
            SECONDS_IN_A_YEAR;
          return { value: change, time: curr.time };
        })
        .filter((a) => Math.abs(a.value) < 10000),
    [targetValues],
  );
  console.log({
    apr: contractAPRs[contractAPRs.length - 1],
  });

  useEffect(() => {
    if (chartRef.current) {
      const chart = createChart(
        chartRef.current,
        window.innerWidth < 600 ? SMOL_CHART_OPTIONS : BASE_CHART_OPTIONS,
      );
      chart.timeScale().applyOptions({ ...BASE_TIME_SCALE_OPTIONS });

      const contractAPRSeries = chart.addLineSeries({
        ...BASE_LINE_SERIES_OPTIONS,
        color: APR_COLOR,
        priceFormat: { type: 'percent' },
      });
      contractAPRSeries.setData(contractAPRs);

      const priceSeries = chart.addLineSeries({
        ...BASE_LINE_SERIES_OPTIONS,
        color: priceColor,
        priceFormat: { type: 'price', minMove: 0.001, precision: 3 },
        priceScaleId: 'left',
      });
      priceSeries.setData(markValues);

      chart.timeScale().fitContent();

      return () => chart.remove();
    }
  }, [contractAPRs, markValues, priceColor]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        <span className={styles[`price-label-${tokenName}`]}>
          papr price in WETH
        </span>{' '}
      </div>
      <div className={styles.chart} ref={chartRef} />
      <div className={styles.label}>
        <span className={styles['apr-label']}>Contract APR</span>{' '}
      </div>
    </div>
  );
}

export default Charts;
