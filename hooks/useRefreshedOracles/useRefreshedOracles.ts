import { SupportedNetwork } from 'lib/config';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { useCallback, useEffect, useState } from 'react';

export function useRefreshedOracles(
  collections: string[],
  network: SupportedNetwork,
) {
  const [oracleInfo, setOracleInfo] = useState<{
    [key: string]: ReservoirResponseData;
  }>({});
  const [oraclesLoading, setOraclesLoading] = useState<boolean>(true);

  const getOracles = useCallback(
    async (collections: string[]) => {
      const oracleInfoFromAPI: ReservoirResponseData[] = await Promise.all(
        collections.map(async (collection) => {
          const req = await fetch(
            `/api/networks/${network}/oracle/collections/${collection}`,
            {
              method: 'POST',
            },
          );
          const json = await req.json();
          return json;
        }),
      );
      const oracleInfoMap = collections.reduce(
        (prev, current, i) => ({ ...prev, [current]: oracleInfoFromAPI[i] }),
        {},
      );
      //   setOracleInfo(oracleInfoMap);
      //   setOraclesLoading(false);
    },
    [network],
  );

  useEffect(() => {
    if (collections.length === 0) {
      setOraclesLoading(false);
      return;
    }
    getOracles(collections);
  }, [collections, getOracles]);

  return {
    oracleInfo,
    oraclesLoading,
  };
}
