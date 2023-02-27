import { CenterAsset } from 'components/CenterAsset';
import { AuctionCountdown } from 'components/Controllers/AuctionPageContent/AuctionCountdown';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { useLiveAuctionPrice } from 'hooks/useLiveAuctionPrice';
import { useNFTFlagged } from 'hooks/useNFTFlagged';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { getUnitPriceForEth } from 'lib/coingecko';
import { configs, SupportedNetwork, SupportedToken } from 'lib/config';
import { formatBigNum } from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
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
  const { tokenName } = useConfig();
  const controller = useController();
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const latestUniswapPrice = useLatestMarketPrice();

  const {
    liveAuctionPrice,
    liveAuctionPriceUnderlying,
    liveTimestamp,
    hourlyPriceChange,
    priceUpdated,
  } = useLiveAuctionPrice(auction, 8000);

  const [timeElapsed, setTimeElapsed] = useState<number>(
    currentTimeInSeconds() - auction.start.timestamp,
  );

  const ethPrice = useAsyncValue(() => {
    return getUnitPriceForEth(
      'usd',
      configs[tokenName as SupportedToken].network as SupportedNetwork,
    );
  }, [tokenName]);

  const liveAuctionPriceUSD = useMemo(() => {
    if (!liveAuctionPriceUnderlying || !ethPrice) return null;
    return (
      parseFloat(
        ethers.utils.formatUnits(
          liveAuctionPriceUnderlying,
          controller.underlying.decimals,
        ),
      ) * ethPrice
    );
  }, [liveAuctionPriceUnderlying, controller.underlying.decimals, ethPrice]);

  const floorUSDPrice = useMemo(() => {
    if (!oracleInfo || !ethPrice) return 0;
    return oracleInfo[auction.auctionAssetContract.id].price * ethPrice;
  }, [oracleInfo, ethPrice, auction.auctionAssetContract.id]);

  const auctionCompleted = useMemo(() => {
    return !!auction.endPrice;
  }, [auction.endPrice]);

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

  if (!oracleInfo || !latestUniswapPrice) return <></>;

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
                {liveAuctionPriceUnderlying && (
                  <>
                    {formatBigNum(
                      liveAuctionPriceUnderlying,
                      controller.underlying.decimals,
                    )}{' '}
                    {controller.underlying.symbol}
                  </>
                )}
              </p>
              {!liveAuctionPriceUnderlying && <>...</>}
              <p>
                {formatBigNum(liveAuctionPrice, auction.paymentAsset.decimals)}{' '}
                {tokenName}
              </p>
              <p>
                {liveAuctionPriceUSD && <>${liveAuctionPriceUSD.toFixed(4)}</>}
                {!liveAuctionPriceUSD && <>...</>}
              </p>
            </div>
          </div>
          <div className={styles.summary}>
            <SummaryTable
              auction={auction}
              hourlyPriceChange={hourlyPriceChange}
              auctionUnderlyingPrice={liveAuctionPriceUnderlying}
              priceUpdated={priceUpdated}
              timeElapsed={timeElapsed}
            />
          </div>
        </div>
      </div>
      <AuctionGraph
        auction={auction}
        auctionUnderlyingPrice={liveAuctionPriceUnderlying}
        liveTimestamp={liveTimestamp}
        timeElapsed={timeElapsed}
        oracleInfo={oracleInfo}
        latestUniswapPrice={latestUniswapPrice}
        floorUSDPrice={floorUSDPrice}
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
};

function SummaryTable({
  auction,
  hourlyPriceChange,
  auctionUnderlyingPrice,
  priceUpdated,
  timeElapsed,
}: SummaryTableProps) {
  const oracleInfo = useOracleInfo(OraclePriceType.spot);
  const controller = useController();

  const percentFloor = useMemo(() => {
    if (!oracleInfo || !auctionUnderlyingPrice) return '0.000';
    const floor = oracleInfo[auction.auctionAssetContract.id].price;
    const percent =
      (parseFloat(
        formatBigNum(auctionUnderlyingPrice, controller.underlying.decimals),
      ) /
        floor) *
      100;
    return percent.toFixed(3);
  }, [
    oracleInfo,
    auctionUnderlyingPrice,
    auction.auctionAssetContract.id,
    controller.underlying.decimals,
  ]);

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
            {percentFloor}%
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
