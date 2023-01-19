import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { SECONDS_IN_A_DAY } from 'lib/constants';
import { useEffect, useMemo, useState } from 'react';
import {
  PoolDayDatasDocument,
  PoolDayDatasQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';

type ChartData = {
  date: number;
  volumeUSD: string;
  tvlUSD: string;
  feesUSD: string;
  pool: {
    feeTier: string;
  };
}[];

// Fri Apr 23 2021 09:42:55 GMT+0000 (beginning of Uniswap V3, can probably make this beginning of papr)
const START_TIME = 1619170975;
const END_TIME = Date.now() / 1000;

export function usePoolChartData() {
  const { uniswapSubgraph } = useConfig();
  const { poolAddress } = useController();
  const [rawChartData, setRawChartData] = useState<ChartData>([]);
  const [skip, setSkip] = useState(0);
  const [allFound, setAllFound] = useState(false);

  const [{ data, fetching }] = useQuery<PoolDayDatasQuery>({
    query: PoolDayDatasDocument,
    variables: {
      address: poolAddress,
      startTime: START_TIME,
      endTime: END_TIME,
      skip,
    },
    context: useMemo(
      () => ({
        url: uniswapSubgraph,
      }),
      [uniswapSubgraph],
    ),
  });

  useEffect(() => {
    if (!fetching && data) {
      setRawChartData((prev) => prev.concat(data.poolDayDatas));
      if (data.poolDayDatas.length < 1000) {
        setAllFound(true);
      } else {
        setSkip((prev) => prev + 1000);
      }
    }
  }, [data, fetching]);

  const chartData = useMemo(
    () => formatChartData(rawChartData),
    [rawChartData],
  );

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
  let timestamp = firstEntry?.time ?? START_TIME;
  let latestTvl = firstEntry?.liquidityUSD ?? 0;
  while (timestamp < END_TIME - SECONDS_IN_A_DAY) {
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
