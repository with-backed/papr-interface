import { ethers } from 'ethers';
import { currentPrice } from 'lib/auctions';
import { convertOneScaledValue } from 'lib/controllers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';

const currentTimeInSeconds = () => Math.floor(new Date().getTime() / 1000);
const ONE_HOUR_IN_SECONDS = 60 * 60;

export function useLiveAuctionPrice(
  auction: NonNullable<AuctionQuery['auction']>,
  priceRefreshTime = 14000,
) {
  const [liveTimestamp, setLiveTimestamp] = useState<number>(
    currentTimeInSeconds(),
  );
  const liveAuctionPrice = useMemo(() => {
    const secondsElapsed = liveTimestamp - auction.start.timestamp;
    return currentPrice(
      ethers.BigNumber.from(auction.startPrice),
      secondsElapsed,
      parseInt(auction.secondsInPeriod),
      convertOneScaledValue(
        ethers.BigNumber.from(auction.perPeriodDecayPercentWad),
        4,
      ),
    );
  }, [auction, liveTimestamp]);

  const [priceUpdated, setPriceUpdated] = useState<boolean>(false);

  const hourlyPriceChange = useMemo(() => {
    const timestamp = currentTimeInSeconds();
    const secondsElapsedAnHourAgo =
      timestamp - ONE_HOUR_IN_SECONDS - auction.start.timestamp;
    const priceAnHourAgo = currentPrice(
      ethers.BigNumber.from(auction.startPrice),
      secondsElapsedAnHourAgo,
      parseInt(auction.secondsInPeriod),
      convertOneScaledValue(
        ethers.BigNumber.from(auction.perPeriodDecayPercentWad),
        4,
      ),
    );
    return liveAuctionPrice.sub(priceAnHourAgo);
  }, [liveAuctionPrice, auction]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTimestamp(currentTimeInSeconds());
      setPriceUpdated(true);
      setTimeout(() => {
        setPriceUpdated(false);
      }, 1000);
    }, priceRefreshTime);
    return () => clearInterval(interval);
  }, [auction, priceRefreshTime]);

  return { liveAuctionPrice, liveTimestamp, hourlyPriceChange, priceUpdated };
}
