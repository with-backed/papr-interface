import { TextButton } from 'components/Button';
import { usePoolChartData } from 'hooks/usePoolChartData';
import { useTheme } from 'hooks/useTheme';
import { ChartOptions, createChart, DeepPartial } from 'lightweight-charts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './LPPageContent.module.css';

type ChartView = 'volumeUSD' | 'liquidityUSD' | 'feesUSD';

const BASE_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  grid: { horzLines: { visible: false }, vertLines: { visible: false } },
  layout: {
    textColor: 'black',
    fontFamily: "'Courier Prime', 'Courier New', monospace",
    fontSize: 12,
  },
  rightPriceScale: {
    visible: false,
  },
};

export function Chart() {
  const [view, setView] = useState<ChartView>('volumeUSD');
  const chartRef = useRef<HTMLDivElement>(null);
  const { chartData, allFound } = usePoolChartData();
  const theme = useTheme();

  const primaryColor = useMemo(() => {
    return {
      meme: '#47b79c',
      trash: '#ff6333',
      hero: '#908ee7',
      papr: '#5397ff',
    }[theme];
  }, [theme]);

  const series = useMemo(
    () =>
      chartData.map(({ time, ...props }) => ({
        time,
        value: /*props[view]*/ (Math.random() * 1000) | 0,
      })),
    [chartData],
  );

  useEffect(() => {
    if (chartRef.current) {
      const chart = createChart(chartRef.current, { ...BASE_CHART_OPTIONS });
      const histogramSeries = chart.addHistogramSeries({
        color: primaryColor,
        priceLineVisible: false,
      });
      histogramSeries.setData(series as any);
      chart.timeScale().fitContent();

      return () => chart.remove();
    }
  }, [primaryColor, series]);

  const viewSelectorFactory = useCallback(
    (view: ChartView) => () => setView(view),
    [],
  );
  const [handleVolumeClick, handleLiquidityClick, handleFeesClick] = useMemo(
    () => [
      viewSelectorFactory('volumeUSD'),
      viewSelectorFactory('liquidityUSD'),
      viewSelectorFactory('feesUSD'),
    ],
    [viewSelectorFactory],
  );

  return (
    <div className={styles['chart-wrapper']}>
      <div className={styles['chart-controls']}>
        CHART:
        <TextButton
          onClick={handleVolumeClick}
          className={
            styles[
              view === 'volumeUSD' ? 'chart-button-active' : 'chart-button'
            ]
          }>
          Volume
        </TextButton>
        <TextButton
          onClick={handleLiquidityClick}
          className={
            styles[
              view === 'liquidityUSD' ? 'chart-button-active' : 'chart-button'
            ]
          }>
          Liquidity
        </TextButton>
        <TextButton
          onClick={handleFeesClick}
          className={
            styles[view === 'feesUSD' ? 'chart-button-active' : 'chart-button']
          }>
          Fees
        </TextButton>
      </div>
      <div ref={chartRef} className={styles.chart}></div>
    </div>
  );
}
