import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useEffect, useMemo, useState } from 'react';
import {
  PoolDayDatasDocument,
  PoolDayDatasQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { CombinedError, useQuery } from 'urql';

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

  return {
    chartData: rawChartData,
    allFound,
  };
}
