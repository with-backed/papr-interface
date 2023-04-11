import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { AuctionType, currentPrice } from 'lib/auctions';
import { SupportedToken } from 'lib/config';
import { getQuoteForSwapOutput } from 'lib/controllers';
import { useCallback, useEffect, useMemo, useState } from 'react';

const currentTimeInSeconds = () => Math.floor(new Date().getTime() / 1000);
const ONE_HOUR_IN_SECONDS = 60 * 60;

export function useLiveAuctionPrice(
  auction: AuctionType,
  priceRefreshTime = 14000,
  pause = false,
) {
  const { tokenName } = useConfig();
  const controller = useController();
  const [liveTimestamp, setLiveTimestamp] = useState<number>(
    currentTimeInSeconds(),
  );

  const liveAuctionPrice = useMemo(() => {
    if (auction.endPrice) return ethers.BigNumber.from(auction.endPrice);
    return currentPrice(auction, liveTimestamp);
  }, [auction, liveTimestamp]);

  const calculateLiveAuctionPriceUnderlying = useCallback(() => {
    return getQuoteForSwapOutput(
      liveAuctionPrice,
      controller.underlying.id,
      auction.paymentAsset.id,
      tokenName as SupportedToken,
    );
  }, [auction, liveAuctionPrice, controller.underlying.id, tokenName]);

  const [liveAuctionPriceUnderlying, setLiveAuctionPriceUnderlying] =
    useState<ethers.BigNumber | null>(null);

  const [priceUpdated, setPriceUpdated] = useState<boolean>(false);

  const hourlyPriceChange = useMemo(() => {
    const timestamp = currentTimeInSeconds();
    const priceAnHourAgo = currentPrice(
      auction,
      timestamp - ONE_HOUR_IN_SECONDS,
    );
    return liveAuctionPrice.sub(priceAnHourAgo);
  }, [liveAuctionPrice, auction]);

  useEffect(() => {
    if (!auction.end) {
      if (!pause) {
        const interval = setInterval(() => {
          setLiveTimestamp(currentTimeInSeconds());
          setPriceUpdated(true);
          setTimeout(() => {
            setPriceUpdated(false);
          }, 1000);
        }, priceRefreshTime);
        return () => clearInterval(interval);
      }
    } else {
      setLiveTimestamp(auction.end.timestamp);
    }
  }, [auction, priceRefreshTime, pause]);

  useEffect(() => {
    calculateLiveAuctionPriceUnderlying().then((quoteResult) => {
      setLiveAuctionPriceUnderlying(quoteResult.quote);
    });
  }, [calculateLiveAuctionPriceUnderlying]);

  return {
    liveAuctionPrice,
    liveAuctionPriceUnderlying,
    liveTimestamp,
    hourlyPriceChange,
    priceUpdated,
  };
}
