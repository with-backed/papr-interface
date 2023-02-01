import { usePoolDayDatas } from 'hooks/usePoolDayDatas';
import {
  SECONDS_IN_A_DAY,
  UNISWAP_SUBGRAPH_END,
  UNISWAP_SUBGRAPH_START,
} from 'lib/constants';
import { useMemo } from 'react';

type ChartData = {
  date: number;
  volumeUSD: string;
  tvlUSD: string;
  feesUSD: string;
  pool: {
    feeTier: string;
  };
}[];

export function usePoolChartData() {
  const { data, allFound } = usePoolDayDatas();

  const chartData = useMemo(() => formatChartData(data), [data]);

  return {
    chartData,
    allFound,
  };
}

export type PoolChartEntry = {
  time: number;
  volumeUSD: number;
  liquidityUSD: number;
  feesUSD: number;
};

function formatChartData(chartData: ChartData) {
  if (chartData.length === 0) {
    return [];
  }
  const formatted = chartData.reduce(
    (acc: { [date: number]: PoolChartEntry }, dayData) => {
      const roundedDate = parseInt(
        (dayData.date / SECONDS_IN_A_DAY).toFixed(0),
      );
      const feePercent = parseFloat(dayData.pool.feeTier) / 10000;
      const tvlAdjust = dayData?.volumeUSD
        ? parseFloat(dayData.volumeUSD) * feePercent
        : 0;

      acc[roundedDate] = {
        time: dayData.date,
        volumeUSD: parseFloat(dayData.volumeUSD),
        liquidityUSD: parseFloat(dayData.tvlUSD) - tvlAdjust,
        feesUSD: parseFloat(dayData.feesUSD),
      };
      return acc;
    },
    {},
  );

  const firstEntry = formatted[parseInt(Object.keys(formatted)[0])];

  // fill in empty days ( there will be no day datas if no trades made that day )
  let timestamp = firstEntry?.time ?? UNISWAP_SUBGRAPH_START;
  let latestTvl = firstEntry?.liquidityUSD ?? 0;
  while (timestamp < UNISWAP_SUBGRAPH_END - SECONDS_IN_A_DAY) {
    const nextDay = timestamp + SECONDS_IN_A_DAY;
    const currentDayIndex = parseInt((nextDay / SECONDS_IN_A_DAY).toFixed(0));
    if (!Object.keys(formatted).includes(currentDayIndex.toString())) {
      formatted[currentDayIndex] = {
        time: nextDay,
        volumeUSD: 0,
        liquidityUSD: latestTvl,
        feesUSD: 0,
      };
    } else {
      latestTvl = formatted[currentDayIndex].liquidityUSD;
    }
    timestamp = nextDay;
  }

  const dateMap = Object.keys(formatted).map((key) => {
    return formatted[parseInt(key)];
  });

  return dateMap;
}
