import { TextButton } from 'components/Button';
import { CenterAsset } from 'components/CenterAsset';
import { EtherscanTransactionLink } from 'components/EtherscanLink';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLiveAuctionPrice } from 'hooks/useLiveAuctionPrice';
import { useShowMore } from 'hooks/useShowMore';
import { SupportedToken } from 'lib/config';
import { erc20Contract } from 'lib/contracts';
import { getDaysHoursMinutesSeconds } from 'lib/duration';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { ERC20 } from 'types/generated/abis';
import {
  AuctionsDocument,
  AuctionsQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import { useAccount } from 'wagmi';

import styles from './Auctions.module.css';

type Auction = AuctionsQuery['auctions'][number];
type ActiveAuction = Auction & { startPrice: string };
type PastAuction = ActiveAuction & { end: { timestamp: number; id: string } };

export function Auctions() {
  const controller = useController();
  const [{ data: auctionsQueryResult, fetching }] = useQuery<AuctionsQuery>({
    query: AuctionsDocument,
  });

  const { activeAuctions, pastAuctions } = useMemo(() => {
    const result: {
      activeAuctions: ActiveAuction[];
      pastAuctions: PastAuction[];
    } = { activeAuctions: [], pastAuctions: [] };

    if (!!auctionsQueryResult?.auctions && !fetching) {
      auctionsQueryResult.auctions
        .filter((a) => a.vault.controller.id === controller.id)
        .forEach((auction) => {
          if (typeof auction.end?.timestamp === 'number') {
            result.pastAuctions.push(auction as PastAuction);
          } else {
            result.activeAuctions.push(auction as ActiveAuction);
          }
        });
    }

    return result;
  }, [auctionsQueryResult, fetching, controller]);

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
  const controller = useController();
  const { address } = useAccount();
  const { tokenName } = useConfig();
  const tokenContract = useMemo(
    () => erc20Contract(controller.paprToken.id, tokenName as SupportedToken),
    [controller.paprToken.id, tokenName],
  );
  const paprApproved = useAsyncValue(async () => {
    if (!address) return null;
    return (
      (await tokenContract.allowance(address, controller.id)) >
      ethers.BigNumber.from(0)
    );
  }, [tokenContract, address, controller.id]);

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
              tokenContract={tokenContract}
              paprApproved={paprApproved}
            />
          ))}
        </tbody>
      </Table>
    </Fieldset>
  );
}

function ActiveAuctionRow({
  auction,
  tokenContract,
  paprApproved,
}: {
  auction: ActiveAuction;
  tokenContract: ERC20;
  paprApproved: boolean | null;
}) {
  const { tokenName } = useConfig();
  const decimals = auction.paymentAsset.decimals;
  const symbol = auction.paymentAsset.symbol;

  const { liveAuctionPrice, hourlyPriceChange } = useLiveAuctionPrice(auction);

  const floorValue = useMemo(
    // Auctions start at 3x the floor value, so we can derive floor by dividing
    () => ethers.BigNumber.from(auction.startPrice).div(3),
    [auction.startPrice],
  );

  return (
    <tr>
      <td className={styles.asset}>
        <CenterAsset
          address={auction.auctionAssetContract.id}
          tokenId={auction.auctionAssetID}
          preset="small"
        />
      </td>
      <td className={styles.right}>#{auction.auctionAssetID}</td>
      <td className={styles.right}>
        {decimals
          ? formatTokenAmount(
              parseFloat(ethers.utils.formatUnits(liveAuctionPrice, decimals)),
            )
          : '...'}{' '}
        {symbol}
      </td>
      <td className={styles.right}>
        {decimals
          ? formatTokenAmount(
              parseFloat(ethers.utils.formatUnits(hourlyPriceChange, decimals)),
            )
          : '...'}
      </td>
      <td className={styles.right}>
        {decimals
          ? formatTokenAmount(
              parseFloat(ethers.utils.formatUnits(floorValue, decimals)),
            )
          : '...'}{' '}
        {symbol}
      </td>
      <td className={styles.center}>
        <Link href={`/tokens/${tokenName}/auctions/${auction.id}`}>View</Link>
      </td>
    </tr>
  );
}

type PastAuctionsProps = {
  auctions: PastAuction[];
  fetching: boolean;
};
function PastAuctions({ auctions, fetching }: PastAuctionsProps) {
  const legend = '🕰 Past Auctions';
  const { feed, remainingLength, amountThatWillShowNext, showMore } =
    useShowMore(auctions);
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
          {feed.map((auction) => (
            <PastAuctionRow key={auction.id} auction={auction} />
          ))}
        </tbody>
      </Table>
      {remainingLength > 0 && (
        <div className={styles['button-container']}>
          <TextButton kind="clickable" onClick={showMore}>
            Load {amountThatWillShowNext} more (of {remainingLength})
          </TextButton>
        </div>
      )}
    </Fieldset>
  );
}

function PastAuctionRow({ auction }: { auction: PastAuction }) {
  const decimals = auction.paymentAsset.decimals;
  const symbol = auction.paymentAsset.symbol;
  const endPrice = useMemo(
    () =>
      decimals && symbol
        ? `${formatTokenAmount(
            parseFloat(ethers.utils.formatUnits(auction.endPrice, decimals)),
          )} ${symbol}`
        : '...',
    [auction.endPrice, decimals, symbol],
  );
  const floorValue = useMemo(
    // Auctions start at 3x the floor value, so we can derive floor by dividing
    () => ethers.BigNumber.from(auction.startPrice).div(3),
    [auction.startPrice],
  );
  const percentOfFloor = useMemo(
    () =>
      ethers.BigNumber.from(auction.endPrice)
        .mul(1000)
        .div(floorValue)
        .toNumber() / 1000,
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
          address={auction.auctionAssetContract.id}
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
