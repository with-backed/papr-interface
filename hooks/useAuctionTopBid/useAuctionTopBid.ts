import { useConfig } from 'hooks/useConfig';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import {
  getTopBidForCollectionAtTime,
  OraclePriceType,
} from 'lib/oracle/reservoir';
import { useEffect, useMemo, useState } from 'react';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';

export function useAuctionTopBid(
  auction: NonNullable<AuctionQuery['auction']>,
) {
  const config = useConfig();
  const oracleInfo = useOracleInfo(OraclePriceType.spot);
  const [topBidAtEnd, setTopBidAtEnd] = useState<number | null>(null);
  const [topBidAtEndFetching, setTopBidAtEndFetching] = useState<boolean>(true);

  useEffect(() => {
    if (auction.end) {
      getTopBidForCollectionAtTime(
        auction.auctionAssetContract.id,
        auction.end.timestamp,
        config,
      ).then((topBid) => {
        setTopBidAtEnd(topBid);
        setTopBidAtEndFetching(false);
      });
    } else {
      setTopBidAtEndFetching(false);
    }
  }, [auction.end, auction.auctionAssetContract.id, config]);

  const topBid = useMemo(() => {
    const topBidReady = !topBidAtEndFetching && oracleInfo;
    if (!topBidReady) return null;
    console.log({ info: oracleInfo[auction.auctionAssetContract.id] });
    return topBidAtEnd
      ? topBidAtEnd
      : oracleInfo[auction.auctionAssetContract.id].price;
  }, [
    topBidAtEnd,
    oracleInfo,
    auction.auctionAssetContract.id,
    topBidAtEndFetching,
  ]);

  return topBid;
}
