import { ethers } from 'ethers';
import { currentPrice } from 'lib/auctions';
import { convertOneScaledValue } from 'lib/controllers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AuctionDocument,
  AuctionQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

const currentTimeInSeconds = () => Math.floor(new Date().getTime() / 1000);

export function useAuction(id: string, priceRefreshTime = 14000) {
  const [{ data: auctionQueryResult, fetching }] = useQuery<AuctionQuery>({
    query: AuctionDocument,
    variables: { id },
  });

  const auction = useMemo(() => {
    if (!auctionQueryResult?.auction) return undefined;
    return auctionQueryResult.auction;
  }, [auctionQueryResult]);

  const calculateAuctionPrice = useCallback(() => {
    if (!auction) return null;
    const timestamp = currentTimeInSeconds();
    const secondsElapsed = timestamp - auction.start.timestamp;
    return currentPrice(
      ethers.BigNumber.from(auction.startPrice),
      secondsElapsed,
      parseInt(auction.secondsInPeriod),
      convertOneScaledValue(
        ethers.BigNumber.from(auction.perPeriodDecayPercentWad),
        4,
      ),
    );
  }, [auction]);

  const [liveAuctionPrice, setLiveAuctionPrice] =
    useState<ethers.BigNumber | null>(null);
  const [priceUpdated, setPriceUpdated] = useState<boolean>(false);

  useEffect(() => {
    if (!auction) return;
    setLiveAuctionPrice(calculateAuctionPrice());
    const interval = setInterval(() => {
      setLiveAuctionPrice(calculateAuctionPrice());
      setPriceUpdated(true);
      setTimeout(() => {
        setPriceUpdated(false);
      }, 1000);
    }, priceRefreshTime);
    return () => clearInterval(interval);
  }, [auction, calculateAuctionPrice, priceRefreshTime]);

  return { auction, liveAuctionPrice, priceUpdated, auctionLoading: fetching };
}
