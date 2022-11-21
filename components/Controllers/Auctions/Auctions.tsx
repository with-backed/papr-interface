import { CenterAsset } from 'components/CenterAsset';
import { EtherscanTransactionLink } from 'components/EtherscanLink';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { erc20Contract } from 'lib/contracts';
import { getDaysHoursMinutesSeconds } from 'lib/duration';
import { formatPercent } from 'lib/numberFormat';
import React, { useMemo } from 'react';
import {
  AuctionsDocument,
  AuctionsQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import styles from './Auctions.module.css';

type Auction = AuctionsQuery['auctions'][number];
type ActiveAuction = Auction & { startPrice: string };
type PastAuction = ActiveAuction & { endTime: number; endPrice: string };

export function Auctions() {
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
        if (typeof auction.endTime === 'number') {
          result.pastAuctions.push(auction as PastAuction);
        } else {
          result.activeAuctions.push(auction as ActiveAuction);
        }
      });
    }

    return result;
  }, [auctionsQueryResult, fetching]);

  console.log({ activeAuctions, pastAuctions });
  return (
    <div className={styles.wrapper}>
      <ActiveAuctions auctions={activeAuctions} fetching={fetching} />
      <PastAuctions auctions={pastAuctions} fetching={fetching} />
    </div>
  );
}

type ActiveAuctionsProps = {
  auctions: ActiveAuction[];
  fetching: boolean;
};
function ActiveAuctions({ auctions, fetching }: ActiveAuctionsProps) {
  const legend = '🔨 Active Auctions';
  if (fetching) {
    <Fieldset legend={legend}>Loading auctions...</Fieldset>;
  }

  if (auctions.length === 0) {
    <Fieldset legend={legend}>No active auctions.</Fieldset>;
  }

  // TODO: make active auction list
  return <Fieldset legend={legend}>Auctions go here</Fieldset>;
}

type PastAuctionsProps = {
  auctions: PastAuction[];
  fetching: boolean;
};
function PastAuctions({ auctions, fetching }: PastAuctionsProps) {
  const legend = '🕰 Past Auctions';
  if (fetching) {
    <Fieldset legend={legend}>Loading auctions...</Fieldset>;
  }

  if (auctions.length === 0) {
    <Fieldset legend={legend}>No past auctions.</Fieldset>;
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
      auction.endTime - auction.startTime,
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
        <EtherscanTransactionLink transactionHash={auction.endTxHash}>
          tx
        </EtherscanTransactionLink>
      </td>
    </tr>
  );
}
