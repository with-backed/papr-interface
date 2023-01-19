import { usePoolChartData } from 'hooks/usePoolChartData';
import { ChartOptions, createChart, DeepPartial } from 'lightweight-charts';
import { useEffect, useMemo, useRef, useState } from 'react';

type ChartView = 'volumeUSD' | 'liquidityUSD' | 'feesUSD';

const BASE_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  height: 360,
  width: 500,
  grid: { horzLines: { visible: false }, vertLines: { visible: false } },
  layout: {
    textColor: 'black',
    fontFamily: "'Courier Prime', 'Courier New', monospace",
    fontSize: 12,
  },
};

export function Chart() {
  const [view, setView] = useState<ChartView>('volumeUSD');
  const chartRef = useRef<HTMLDivElement>(null);
  const { chartData, allFound } = usePoolChartData();

  const series = useMemo(
    () => chartData.map(({ time, ...props }) => ({ time, value: props[view] })),
    [chartData, view],
  );

  useEffect(() => {
    if (chartRef.current) {
      const chart = createChart(chartRef.current, { ...BASE_CHART_OPTIONS });
      const histogramSeries = chart.addHistogramSeries();
      histogramSeries.setData(series as any);
      chart.timeScale().fitContent();

      return () => chart.remove();
    }
  }, [series]);

  console.log({ series });

  return <div ref={chartRef}></div>;
}
