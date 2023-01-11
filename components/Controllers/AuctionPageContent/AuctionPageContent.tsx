import { CenterAsset } from 'components/CenterAsset';
import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { currentPrice } from 'lib/auctions';
import { configs, SupportedNetwork, SupportedToken } from 'lib/config';
import { convertOneScaledValue, getQuoteForSwapOutput } from 'lib/controllers';
import { formatBigNum } from 'lib/numberFormat';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ERC721__factory } from 'types/generated/abis';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';
import { AuctionCountdown } from 'components/Controllers/AuctionPageContent/AuctionCountdown';
import styles from './AuctionPageContent.module.css';
import { Table } from 'components/Table';
import dayjs from 'dayjs';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { getTimestamp } from 'hooks/useTimestamp/useTimestamp';
import { getUnitPriceForCoinInEth } from 'lib/coingecko';

export type AuctionPageContentProps = {
  auction: NonNullable<AuctionQuery['auction']>;
};

export function AuctionPageContent({ auction }: AuctionPageContentProps) {
  const signerOrProvider = useSignerOrProvider();
  const { tokenName } = useConfig();
  const controller = useController();

  const calculateAuctionPrice = useCallback(() => {
    const timestamp = getTimestamp();
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

  const [currentAuctionPrice, setCurrentAuctionPrice] =
    useState<ethers.BigNumber>(calculateAuctionPrice());
  const [updating, setUpdating] = useState<boolean>(false);

  const connectedNFT = useMemo(() => {
    if (!auction) return undefined;
    return ERC721__factory.connect(
      auction.auctionAssetContract.id,
      signerOrProvider,
    );
  }, [auction, signerOrProvider]);
  const nftSymbol = useAsyncValue(
    async () => (!connectedNFT ? '' : connectedNFT.symbol()),
    [connectedNFT],
  );

  const auctionUnderlyingPrice = useAsyncValue(() => {
    return getQuoteForSwapOutput(
      currentAuctionPrice,
      controller.underlying.id,
      auction.paymentAsset.id,
      tokenName as SupportedToken,
    );
  }, [auction, currentAuctionPrice, controller.underlying.id, tokenName]);

  const ethPrice = useAsyncValue(() => {
    return getUnitPriceForCoinInEth(
      controller.underlying.id,
      configs[tokenName as SupportedToken].network as SupportedNetwork,
    );
  }, [controller.underlying.id, tokenName]);

  const auctionEthPrice = useMemo(() => {
    if (!auctionUnderlyingPrice || !ethPrice) return null;
    return auctionUnderlyingPrice.mul(ethers.BigNumber.from(ethPrice));
  }, [auctionUnderlyingPrice, ethPrice]);

  useEffect(() => {
    const setStateInterval = setInterval(() => {
      setCurrentAuctionPrice(calculateAuctionPrice());
      setUpdating(true);
      setTimeout(() => {
        setUpdating(false);
      }, 1000);
    }, 9900);
    return () => {
      clearInterval(setStateInterval);
    };
  }, [calculateAuctionPrice]);

  return (
    <Fieldset legend={`${nftSymbol} #${auction.auctionAssetID}`}>
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
                updating ? styles.updating : ''
              }`}>
              <p>
                {auctionUnderlyingPrice && (
                  <>
                    $
                    {formatBigNum(
                      auctionUnderlyingPrice,
                      controller.underlying.decimals,
                    )}
                  </>
                )}
              </p>
              {!auctionUnderlyingPrice && <>...</>}
              <p>
                {formatBigNum(
                  currentAuctionPrice,
                  auction.paymentAsset.decimals,
                )}{' '}
                {tokenName}
              </p>
              <p>
                {auctionEthPrice && (
                  <>
                    {formatBigNum(
                      auctionEthPrice,
                      controller.underlying.decimals,
                    )}{' '}
                    ETH
                  </>
                )}
                {!auctionEthPrice && <>...</>}
              </p>
            </div>
          </div>
          <div className={styles.summary}>
            <SummaryTable
              auction={auction}
              auctionPrice={currentAuctionPrice}
              auctionUnderlyingPrice={auctionUnderlyingPrice}
              updating={updating}
            />
          </div>
        </div>
      </div>
    </Fieldset>
  );
}

const ONE_HOUR_IN_SECONDS = 60 * 60;
const currentTimeInSeconds = () => Math.floor(new Date().getTime() / 1000);

type SummaryTableProps = {
  auction: NonNullable<AuctionQuery['auction']>;
  auctionPrice: ethers.BigNumber;
  auctionUnderlyingPrice: ethers.BigNumber | null;
  updating: boolean;
};

function SummaryTable({
  auction,
  auctionPrice,
  auctionUnderlyingPrice,
  updating,
}: SummaryTableProps) {
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const controller = useController();
  const [timeElapsed, setTimeElapsed] = useState<number>(
    currentTimeInSeconds() - auction.start.timestamp,
  );

  const hourlyPriceChange = useMemo(() => {
    const timestamp = getTimestamp();
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
    return auctionPrice.sub(priceAnHourAgo);
  }, [auctionPrice, auction]);

  const percentFloor = useMemo(() => {
    if (!oracleInfo || !auctionUnderlyingPrice) return null;
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
    return dayjs.duration(timeElapsed, 'seconds').format('HH:mm:ss');
  }, [timeElapsed]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(currentTimeInSeconds() - auction.start.timestamp);
    }, 1000);
    return () => clearInterval(interval);
  });

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
              updating ? styles.updating : ''
            }`}>
            {percentFloor}%
          </td>
          <td
            className={`${styles.updatable} ${
              updating ? styles.updating : ''
            }`}>
            {formatBigNum(hourlyPriceChange, auction.paymentAsset.decimals)}
          </td>
        </tr>
      </tbody>
    </Table>
  );
}
