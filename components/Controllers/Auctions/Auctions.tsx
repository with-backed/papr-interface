import PaprControllerABI from 'abis/PaprController.json';
import { TextButton } from 'components/Button';
import { CenterAsset } from 'components/CenterAsset';
import { EtherscanTransactionLink } from 'components/EtherscanLink';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { useTimestamp } from 'hooks/useTimestamp';
import { currentPrice } from 'lib/auctions';
import { erc20Contract } from 'lib/contracts';
import { convertOneScaledValue } from 'lib/controllers';
import { getDaysHoursMinutesSeconds } from 'lib/duration';
import { formatPercent } from 'lib/numberFormat';
import { PaprController } from 'lib/PaprController';
import React, { useMemo } from 'react';
import {
  AuctionsDocument,
  AuctionsQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import styles from './Auctions.module.css';

type Auction = AuctionsQuery['auctions'][number];
type ActiveAuction = Auction & { startPrice: string };
type PastAuction = ActiveAuction & { end: { timestamp: number; id: string } };

const ONE_HOUR_IN_SECONDS = 60 * 60;

type AuctionsProps = {
  paprController: PaprController;
};
export function Auctions({ paprController }: AuctionsProps) {
  const [{ data: auctionsQueryResult, fetching }] = useQuery<AuctionsQuery>({
    query: AuctionsDocument,
  });

  const { activeAuctions, pastAuctions } = useMemo(() => {
    const result: {
      activeAuctions: ActiveAuction[];
      pastAuctions: PastAuction[];
    } = { activeAuctions: [], pastAuctions: [] };

    if (!!auctionsQueryResult?.auctions && !fetching) {
      auctionsQueryResult.auctions.forEach((auction) => {
        if (typeof auction.end?.timestamp === 'number') {
          result.pastAuctions.push(auction as PastAuction);
        } else {
          result.activeAuctions.push(auction as ActiveAuction);
        }
      });
    }

    return result;
  }, [auctionsQueryResult, fetching]);

  return (
    <div className={styles.wrapper}>
      <ActiveAuctions
        auctions={activeAuctions}
        fetching={fetching}
        controllerId={paprController.id}
      />
      <PastAuctions auctions={pastAuctions} fetching={fetching} />
    </div>
  );
}

type ActiveAuctionsProps = {
  auctions: ActiveAuction[];
  fetching: boolean;
  controllerId: string;
};
function ActiveAuctions({
  auctions,
  controllerId,
  fetching,
}: ActiveAuctionsProps) {
  const legend = '🔨 Active Auctions';
  if (fetching) {
    return <Fieldset legend={legend}>Loading auctions...</Fieldset>;
  }

  if (auctions.length === 0) {
    return <Fieldset legend={legend}>No active auctions.</Fieldset>;
  }

  return (
    <Fieldset legend={legend}>
      <Table>
        <thead>
          <tr>
            <th></th>
            <th className={styles.right}>ID</th>
            <th className={styles.right}>Current</th>
            <th className={styles.right}>△1hr</th>
            <th className={styles.right}>Floor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {auctions.map((auction) => (
            <ActiveAuctionRow
              key={auction.id}
              auction={auction}
              controllerId={controllerId}
            />
          ))}
        </tbody>
      </Table>
    </Fieldset>
  );
}

function ActiveAuctionRow({
  auction,
  controllerId,
}: {
  auction: ActiveAuction;
  controllerId: string;
}) {
  const timestamp = useTimestamp();
  const signerOrProvider = useSignerOrProvider();
  const assetContract = useMemo(
    () => erc20Contract(auction.paymentAsset, signerOrProvider),
    [auction.paymentAsset, signerOrProvider],
  );
  const decimals = useAsyncValue(
    () => assetContract.decimals(),
    [assetContract],
  );
  const symbol = useAsyncValue(() => assetContract.symbol(), [assetContract]);
  const priceBigNum = useMemo(() => {
    if (!timestamp) {
      return ethers.BigNumber.from(0);
    }
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
  }, [auction, timestamp]);

  const priceBigNumAnHourAgo = useMemo(() => {
    if (!timestamp) {
      return ethers.BigNumber.from(0);
    }
    const secondsElapsed =
      timestamp - ONE_HOUR_IN_SECONDS - auction.start.timestamp;
    return currentPrice(
      ethers.BigNumber.from(auction.startPrice),
      secondsElapsed,
      parseInt(auction.secondsInPeriod),
      convertOneScaledValue(
        ethers.BigNumber.from(auction.perPeriodDecayPercentWad),
        4,
      ),
    );
  }, [auction, timestamp]);

  const hourlyPriceChange = useMemo(
    () => priceBigNum.sub(priceBigNumAnHourAgo),
    [priceBigNum, priceBigNumAnHourAgo],
  );

  const floorValue = useMemo(
    // Auctions start at 3x the floor value, so we can derive floor by dividing
    () => ethers.BigNumber.from(auction.startPrice).div(3),
    [auction.startPrice],
  );

  const { address } = useAccount();

  return (
    <tr>
      <td className={styles.asset}>
        <CenterAsset
          address={auction.auctionAssetContract}
          tokenId={auction.auctionAssetID}
          preset="small"
        />
      </td>
      <td className={styles.right}>#{auction.auctionAssetID}</td>
      <td className={styles.right}>
        {decimals ? ethers.utils.formatUnits(priceBigNum, decimals) : '...'}{' '}
        {symbol}
      </td>
      <td className={styles.right}>
        {decimals
          ? ethers.utils.formatUnits(hourlyPriceChange, decimals)
          : '...'}
      </td>
      <td className={styles.right}>
        {decimals ? ethers.utils.formatUnits(floorValue, decimals) : '...'}{' '}
        {symbol}
      </td>
      <td className={styles.center}>
        {address ? (
          <BuyButton auction={auction} controllerId={controllerId} />
        ) : null}
      </td>
    </tr>
  );
}

type BuyButtonProps = {
  auction: ActiveAuction;
  controllerId: string;
};
function BuyButton({ auction, controllerId }: BuyButtonProps) {
  const { address } = useAccount();
  const oracleInfo = useOracleInfo();
  const { config } = usePrepareContractWrite({
    address: controllerId,
    abi: PaprControllerABI.abi,
    functionName: 'purchaseLiquidationAuctionNFT',
    args: [auction, currentPrice, address, oracleInfo],
  });
  const { write } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      data.wait().then(() => window.location.reload());
    },
    // TODO: figure out what's wrong here
  } as any);
  return <TextButton onClick={write!}>Buy</TextButton>;
}

type PastAuctionsProps = {
  auctions: PastAuction[];
  fetching: boolean;
};
function PastAuctions({ auctions, fetching }: PastAuctionsProps) {
  const legend = '🕰 Past Auctions';
  if (fetching) {
    return <Fieldset legend={legend}>Loading auctions...</Fieldset>;
  }

  if (auctions.length === 0) {
    return <Fieldset legend={legend}>No past auctions.</Fieldset>;
  }

  return (
    <Fieldset legend={legend}>
      <Table>
        <thead>
          <tr>
            <th></th>
            <th className={styles.right}>ID</th>
            <th className={styles.right}>Price</th>
            <th className={styles.right}>% Floor</th>
            <th className={styles.right}>Length</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {auctions.map((auction) => (
            <PastAuctionRow key={auction.id} auction={auction} />
          ))}
        </tbody>
      </Table>
    </Fieldset>
  );
}

function PastAuctionRow({ auction }: { auction: PastAuction }) {
  const signerOrProvider = useSignerOrProvider();
  const assetContract = useMemo(
    () => erc20Contract(auction.paymentAsset, signerOrProvider),
    [auction.paymentAsset, signerOrProvider],
  );
  const decimals = useAsyncValue(
    () => assetContract.decimals(),
    [assetContract],
  );
  const symbol = useAsyncValue(() => assetContract.symbol(), [assetContract]);
  const endPrice = useMemo(
    () =>
      decimals && symbol
        ? `${ethers.utils.formatUnits(auction.endPrice, decimals)} ${symbol}`
        : '...',
    [auction.endPrice, decimals, symbol],
  );
  const floorValue = useMemo(
    // Auctions start at 3x the floor value, so we can derive floor by dividing
    () => ethers.BigNumber.from(auction.startPrice).div(3),
    [auction.startPrice],
  );
  const percentOfFloor = useMemo(
    () => ethers.BigNumber.from(auction.endPrice).div(floorValue).toNumber(),
    [auction.endPrice, floorValue],
  );
  const duration = useMemo(() => {
    const { days, hours, minutes } = getDaysHoursMinutesSeconds(
      auction.end.timestamp - auction.start.timestamp,
    );
    return `${days}:${hours}:${minutes}`;
  }, [auction]);
  return (
    <tr>
      <td className={styles.asset}>
        <CenterAsset
          address={auction.auctionAssetContract}
          tokenId={auction.auctionAssetID}
          preset="small"
        />
      </td>
      <td className={styles.right}>#{auction.auctionAssetID}</td>
      <td className={styles.right}>{endPrice}</td>
      <td className={styles.right}>{formatPercent(percentOfFloor)}</td>
      <td className={styles.right}>{duration}</td>
      <td className={styles.center}>
        <EtherscanTransactionLink transactionHash={auction.end.id}>
          tx
        </EtherscanTransactionLink>
      </td>
    </tr>
  );
}
