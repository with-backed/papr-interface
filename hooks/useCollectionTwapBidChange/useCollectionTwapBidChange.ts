import { useConfig } from 'hooks/useConfig';
import { useOracleInfo } from 'hooks/useOracleInfo';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { percentChange } from 'lib/tokenPerformance';
import { useEffect, useMemo, useState } from 'react';
import { LatestTwabForCollectionBeforeTimeQuery } from 'types/generated/graphql/twabs';

export function useCollectionTwapBidChange(collection: string) {
  const { tokenName } = useConfig();
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const [twabData, setTwabData] =
    useState<LatestTwabForCollectionBeforeTimeQuery | null>(null);

  useEffect(() => {
    async function getData() {
      const req = await fetch(
        `/api/tokens/${tokenName}/twabs/collections/${collection}`,
        {
          method: 'POST',
        },
      );
      return req.json();
    }

    getData().then(setTwabData);
  }, [collection, tokenName]);

  const currentPriceForCollection = useMemo(() => {
    if (!oracleInfo) return null;
    return oracleInfo[collection].price;
  }, [oracleInfo, collection]);
  const price24hrAgo = useMemo(() => {
    if (!twabData) return null;
    const latest = twabData.twabs[0];
    return latest ? latest.price : null;
  }, [twabData]);

  const twapPriceChange = useMemo(() => {
    if (!currentPriceForCollection || !price24hrAgo) return null;
    return percentChange(price24hrAgo, currentPriceForCollection);
  }, [currentPriceForCollection, price24hrAgo]);

  return {
    currentPriceForCollection,
    price24hrAgo,
    twapPriceChange,
  };
}
