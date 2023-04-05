import { useConfig } from 'hooks/useConfig';
import { useOracleInfo } from 'hooks/useOracleInfo';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { percentChange } from 'lib/tokenPerformance';
import { useMemo, useRef } from 'react';
import {
  LatestTwabForCollectionBeforeTimeQuery,
  LatestTwabForCollectionBeforeTimeDocument,
} from 'types/generated/graphql/twabs';
import { useQuery } from 'urql';

export function useCollectionTwapBidChange(collection: string) {
  const { twabsApi } = useConfig();
  const now = useRef(new Date());
  const twentyFourHoursAgo = useRef(
    new Date(
      (now.current.getTime() / 1000 - 24 * 60 * 60) * 1000,
    ).toISOString(),
  );
  const oracleInfo = useOracleInfo(OraclePriceType.twap);

  const [{ data: twabData }] = useQuery<LatestTwabForCollectionBeforeTimeQuery>(
    {
      query: LatestTwabForCollectionBeforeTimeDocument,
      variables: {
        collection: collection.toLowerCase(),
        earlierThan: twentyFourHoursAgo.current,
      },
      context: useMemo(
        () => ({
          url: twabsApi,
          fetchOptions: {
            headers: {
              'content-type': 'application/json',
              'x-hasura-admin-secret':
                process.env.NEXT_PUBLIC_TWABS_GRAPHQL_TOKEN!,
            },
            method: 'POST',
          },
        }),
        [twabsApi],
      ),
    },
  );

  const currentPriceForCollection = useMemo(() => {
    if (!oracleInfo) return null;
    return oracleInfo[collection].price;
  }, [oracleInfo, collection]);
  const price24hrAgo = useMemo(() => {
    if (!twabData) return null;
    return twabData.twabs[0].price;
  }, [twabData]);

  const twapPriceChange = useMemo(() => {
    if (!currentPriceForCollection || !twabData) return null;
    return percentChange(twabData.twabs[0].price, currentPriceForCollection);
  }, [twabData, currentPriceForCollection]);

  return {
    twapPriceChange,
    currentPriceForCollection,
    price24hrAgo,
  };
}
