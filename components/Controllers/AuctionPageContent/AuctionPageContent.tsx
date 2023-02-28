import { CenterAsset } from 'components/CenterAsset';
import { AuctionCountdown } from 'components/Controllers/AuctionPageContent/AuctionCountdown';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useAuctionTopBid } from 'hooks/useAuctionTopBid';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLiveAuctionPrice } from 'hooks/useLiveAuctionPrice';
import { useNFTFlagged } from 'hooks/useNFTFlagged';
import { usePaprPriceForAuction } from 'hooks/usePaprPriceForAuction';
import { getUnitPriceForEth } from 'lib/coingecko';
import { configs, SupportedNetwork, SupportedToken } from 'lib/config';
import { formatBigNum } from 'lib/numberFormat';
import { useEffect, useMemo, useState } from 'react';
import { TooltipReference, useTooltipState } from 'reakit';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';

import { NFTFlaggedTooltip } from '../TokenPerformance/Tooltips';
import AuctionApproveAndBuy from './AuctionApproveAndBuy';
import { AuctionGraph } from './AuctionGraph';
import styles from './AuctionPageContent.module.css';

export type AuctionPageContentProps = {
  auction: NonNullable<AuctionQuery['auction']>;
  refresh: () => void;
};

export function AuctionPageContent({
  auction,
  refresh,
}: AuctionPageContentProps) {
  const config = useConfig();
  const controller = useController();
  const { paprPrice } = usePaprPriceForAuction(auction);

  const {
    liveAuctionPrice,
    liveAuctionPriceUnderlying,
    liveTimestamp,
    hourlyPriceChange,
    priceUpdated,
  } = useLiveAuctionPrice(auction, 8000);
  const topBid = useAuctionTopBid(auction);

  const [timeElapsed, setTimeElapsed] = useState<number>(
    currentTimeInSeconds() - auction.start.timestamp,
  );

  const auctionCompleted = useMemo(() => {
    return !!auction.end;
  }, [auction.end]);

  const auctionUnderlyingDisplayPrice = useMemo(() => {
    if (!auctionCompleted) {
      if (!liveAuctionPriceUnderlying) return null;
      else
        return formatBigNum(
          liveAuctionPriceUnderlying,
          controller.underlying.decimals,
        );
    } else {
      if (!paprPrice) return null;
      const auctionPriceNumber = parseFloat(
        ethers.utils.formatUnits(
          liveAuctionPrice,
          controller.paprToken.decimals,
        ),
      );
      return (auctionPriceNumber * paprPrice).toFixed(4);
    }
  }, [
    auctionCompleted,
    liveAuctionPriceUnderlying,
    liveAuctionPrice,
    paprPrice,
    controller.underlying.decimals,
    controller.paprToken.decimals,
  ]);

  const ethToUSDPrice = useAsyncValue(() => {
    return getUnitPriceForEth(
      'usd',
      configs[config.tokenName as SupportedToken].network as SupportedNetwork,
    );
  }, [config.tokenName]);

  const liveAuctionPriceUSD = useMemo(() => {
    if (!liveAuctionPriceUnderlying || !ethToUSDPrice) return null;
    return (
      parseFloat(
        ethers.utils.formatUnits(
          liveAuctionPriceUnderlying,
          controller.underlying.decimals,
        ),
      ) * ethToUSDPrice
    );
  }, [
    liveAuctionPriceUnderlying,
    controller.underlying.decimals,
    ethToUSDPrice,
  ]);

  const topBidUSDPrice = useMemo(() => {
    if (!topBid || !ethToUSDPrice) return 0;
    return topBid * ethToUSDPrice;
  }, [topBid, ethToUSDPrice]);

  useEffect(() => {
    if (!auctionCompleted) {
      const interval = setInterval(() => {
        setTimeElapsed(currentTimeInSeconds() - auction.start.timestamp);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeElapsed(auction.end!.timestamp - auction.start.timestamp);
    }
  }, [auctionCompleted, auction.start.timestamp, auction.end]);

  if (!topBid || !paprPrice) return <></>;

  return (
    <Fieldset
      legend={
        <FieldsetHeader
          contractAddress={auction.auctionAssetContract.id}
          tokenId={auction.auctionAssetID}
          symbol={auction.auctionAssetContract.symbol}
        />
      }>
      <div className={styles.headerWrapper}>
        <div className={styles.nft}>
          <CenterAsset
            address={auction.auctionAssetContract.id}
            tokenId={auction.auctionAssetID}
          />
        </div>
        <div className={styles.headerInfo}>
          <div
            className={`${styles.livePrice} ${
              auctionCompleted ? styles.completed : ''
            }`}>
            {auctionCompleted && (
              <div className={styles.sold}>
                <p>SOLD:</p>
              </div>
            )}
            {!auctionCompleted && (
              <div className={styles.countdown}>
                <AuctionCountdown />
              </div>
            )}
            <div
              className={`${styles.prices} ${styles.updatable} ${
                priceUpdated ? styles.updated : ''
              }`}>
              <p>
                {formatBigNum(liveAuctionPrice, auction.paymentAsset.decimals)}{' '}
                {controller.paprToken.symbol}
              </p>
              <p>
                {auctionUnderlyingDisplayPrice && (
                  <>
                    {auctionUnderlyingDisplayPrice}{' '}
                    {controller.underlying.symbol}
                  </>
                )}
                {!auctionUnderlyingDisplayPrice && <>...</>}
              </p>
              {!auctionCompleted && (
                <p>
                  {liveAuctionPriceUSD && (
                    <>${liveAuctionPriceUSD.toFixed(4)}</>
                  )}
                  {!liveAuctionPriceUSD && <>...</>}
                </p>
              )}
            </div>
          </div>
          <div className={styles.summary}>
            <SummaryTable
              auction={auction}
              hourlyPriceChange={hourlyPriceChange}
              auctionUnderlyingPrice={liveAuctionPriceUnderlying}
              priceUpdated={priceUpdated}
              timeElapsed={timeElapsed}
              topBid={topBid}
            />
          </div>
        </div>
      </div>
      <AuctionGraph
        auction={auction}
        auctionPaprPrice={liveAuctionPrice}
        liveTimestamp={liveTimestamp}
        timeElapsed={timeElapsed}
        topBid={topBid}
        paprPrice={paprPrice}
      />
      {!auctionCompleted && (
        <AuctionApproveAndBuy
          auction={auction}
          liveAuctionPrice={liveAuctionPrice}
          refresh={refresh}
        />
      )}
    </Fieldset>
  );
}

const currentTimeInSeconds = () => Math.floor(new Date().getTime() / 1000);

type SummaryTableProps = {
  auction: NonNullable<AuctionQuery['auction']>;
  hourlyPriceChange: ethers.BigNumber;
  auctionUnderlyingPrice: ethers.BigNumber | null;
  priceUpdated: boolean;
  timeElapsed: number;
  topBid: number;
};

function SummaryTable({
  auction,
  hourlyPriceChange,
  auctionUnderlyingPrice,
  priceUpdated,
  timeElapsed,
  topBid,
}: SummaryTableProps) {
  const controller = useController();

  const percentTopBid = useMemo(() => {
    if (!auctionUnderlyingPrice) return '...';
    const percent =
      (parseFloat(
        formatBigNum(auctionUnderlyingPrice, controller.underlying.decimals),
      ) /
        topBid) *
      100;
    return percent.toFixed(3);
  }, [topBid, auctionUnderlyingPrice, controller.underlying.decimals]);

  const formattedTimeElapsed = useMemo(() => {
    return dayjs.duration(timeElapsed, 'seconds').format('D[d] HH:mm:ss');
  }, [timeElapsed]);

  return (
    <Table className={styles.summaryTable}>
      <thead>
        <tr>
          <th>Time</th>
          <th>% Top Bid</th>
          {!auction.endPrice && <th>△1hr</th>}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{formattedTimeElapsed}</td>
          <td
            className={`${styles.updatable} ${
              priceUpdated ? styles.updated : ''
            }`}>
            {percentTopBid}%
          </td>
          {!auction.endPrice && (
            <td
              className={`${styles.updatable} ${
                priceUpdated ? styles.updated : ''
              }`}>
              {formatBigNum(hourlyPriceChange, auction.paymentAsset.decimals)}
            </td>
          )}
        </tr>
      </tbody>
    </Table>
  );
}

type FieldsetHeaderProps = {
  contractAddress: string;
  tokenId: string;
  symbol: string;
};

function FieldsetHeader({
  contractAddress,
  tokenId,
  symbol,
}: FieldsetHeaderProps) {
  const nftFlagged = useNFTFlagged(contractAddress, tokenId);

  const nftFlaggedTooltip = useTooltipState({
    placement: 'bottom-start',
  });
  if (nftFlagged) {
    return (
      <>
        <TooltipReference {...nftFlaggedTooltip}>
          <p>
            🔨 {symbol} #{tokenId} {nftFlagged ? '⚠️' : ''}
          </p>
        </TooltipReference>
        <NFTFlaggedTooltip tooltip={nftFlaggedTooltip} />
      </>
    );
  } else {
    return (
      <p>
        🔨 {symbol} #{tokenId}
      </p>
    );
  }
}
