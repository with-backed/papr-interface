import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { UNISWAP_SUBGRAPH_END, UNISWAP_SUBGRAPH_START } from 'lib/constants';
import { useEffect, useMemo, useState } from 'react';
import {
  PoolDayDatasDocument,
  PoolDayDatasQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';

export function usePoolDayDatas() {
  const { uniswapSubgraph } = useConfig();
  const { poolAddress } = useController();
  const [accumulatedData, setAccumulatedData] = useState<
    PoolDayDatasQuery['poolDayDatas']
  >([]);
  const [skip, setSkip] = useState(0);
  const [allFound, setAllFound] = useState(false);

  const [{ data, fetching }] = useQuery<PoolDayDatasQuery>({
    query: PoolDayDatasDocument,
    variables: {
      address: poolAddress,
      startTime: UNISWAP_SUBGRAPH_START,
      endTime: UNISWAP_SUBGRAPH_END,
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
      setAccumulatedData((prev) => prev.concat(data.poolDayDatas));
      if (data.poolDayDatas.length < 1000) {
        setAllFound(true);
      } else {
        setSkip((prev) => prev + 1000);
      }
    }
  }, [data, fetching]);

  return {
    data: accumulatedData,
    allFound,
  };
}
