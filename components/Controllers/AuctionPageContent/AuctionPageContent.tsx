import { CenterAsset } from 'components/CenterAsset';
import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { configs, SupportedNetwork, SupportedToken } from 'lib/config';
import { getQuoteForSwapOutput } from 'lib/controllers';
import { formatBigNum } from 'lib/numberFormat';
import { useEffect, useMemo, useState } from 'react';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';
import { AuctionCountdown } from 'components/Controllers/AuctionPageContent/AuctionCountdown';
import styles from './AuctionPageContent.module.css';
import { Table } from 'components/Table';
import dayjs from 'dayjs';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { getUnitPriceForEth } from 'lib/coingecko';
import { useLiveAuctionPrice } from 'hooks/useLiveAuctionPrice';
import { AuctionGraph } from './AuctionGraph';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';

export type AuctionPageContentProps = {
  auction: NonNullable<AuctionQuery['auction']>;
};

export function AuctionPageContent({ auction }: AuctionPageContentProps) {
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
      controller.underlying.id,
      configs[tokenName as SupportedToken].network as SupportedNetwork,
    );
  }, [controller.underlying.id, tokenName]);

  const liveAuctionPriceEth = useMemo(() => {
    if (!liveAuctionPriceUnderlying || !ethPrice) return null;
    return liveAuctionPriceUnderlying.div(ethers.BigNumber.from(ethPrice));
  }, [liveAuctionPriceUnderlying, ethPrice]);

  const floorEthPrice = useMemo(() => {
    if (!oracleInfo || !ethPrice) return 0;
    return oracleInfo[auction.auctionAssetContract.id].price / ethPrice;
  }, [oracleInfo, ethPrice, auction.auctionAssetContract.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(currentTimeInSeconds() - auction.start.timestamp);
    }, 1000);
    return () => clearInterval(interval);
  });

  if (!oracleInfo || !latestUniswapPrice) return <></>;

  return (
    <Fieldset
      legend={`${auction.auctionAssetContract.symbol} #${auction.auctionAssetID}`}>
      <div className={styles.headerWrapper}>
        <div className={styles.nft}>
          <CenterAsset
            address={auction.auctionAssetContract.id}
            tokenId={auction.auctionAssetID}
          />
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.livePrice}>
            <div className={styles.countdown}>
              <AuctionCountdown />
            </div>
            <div
              className={`${styles.prices} ${styles.updatable} ${
                priceUpdated ? styles.updated : ''
              }`}>
              <p>
                {liveAuctionPriceUnderlying && (
                  <>
                    $
                    {formatBigNum(
                      liveAuctionPriceUnderlying,
                      controller.underlying.decimals,
                    )}
                  </>
                )}
              </p>
              {!liveAuctionPriceUnderlying && <>...</>}
              <p>
                {formatBigNum(liveAuctionPrice, auction.paymentAsset.decimals)}{' '}
                {tokenName}
              </p>
              <p>
                {liveAuctionPriceEth && (
                  <>
                    {formatBigNum(
                      liveAuctionPriceEth,
                      controller.underlying.decimals,
                    )}{' '}
                    ETH
                  </>
                )}
                {!liveAuctionPriceEth && <>...</>}
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
        floorEthPrice={floorEthPrice}
      />
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
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
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
          <th>△1hr</th>
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
          <td
            className={`${styles.updatable} ${
              priceUpdated ? styles.updated : ''
            }`}>
            {formatBigNum(hourlyPriceChange, auction.paymentAsset.decimals)}
          </td>
        </tr>
      </tbody>
    </Table>
  );
}
