import { DisplayAddress } from 'components/DisplayAddress';
import { DisplayAddressType } from 'components/DisplayAddress/DisplayAddress';
import {
  EtherscanAddressLink,
  EtherscanTransactionLink,
} from 'components/EtherscanLink';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { ethers } from 'ethers';
import { useActivity } from 'hooks/useActivity';
import { ActivityType } from 'hooks/useActivity/useActivity';
import { PaprController, useController } from 'hooks/useController';
import { humanizedTimestamp } from 'lib/duration';
import { formatTokenAmount } from 'lib/numberFormat';
import { formatBigNum } from 'lib/numberFormat';
import React, { useMemo } from 'react';
import { PoolByIdQuery } from 'types/generated/graphql/uniswapSubgraph';

import styles from './Activity.module.css';

type ActivityProps = {
  // If scoping activity view to just a specific account
  account?: string;
  // If scoping activity view to just a specific vault
  vault?: string;
  showSwaps?: boolean;
  subgraphPool: NonNullable<PoolByIdQuery['pool']>;
};

function activityIsSwap(activity: ActivityType) {
  return !!activity.amountIn && !!activity.amountOut;
}

function activityIsAddCollateral(activity: ActivityType) {
  return activity.addedCollateral.length > 0;
}

function activityIsRemoveCollateral(activity: ActivityType) {
  return activity.removedCollateral.length > 0;
}

function activityIsAuctionStart(activity: ActivityType) {
  return !!activity.auctionTokenId && !activity.auctionEndPrice;
}

function activityIsAuctionEnd(activity: ActivityType) {
  return !!activity.auctionTokenId && !!activity.auctionEndPrice;
}

export function Activity({
  account,
  vault,
  showSwaps = true,
  subgraphPool,
}: ActivityProps) {
  const paprController = useController();

  const { data: activityData, fetching: activityFetching } = useActivity(
    paprController.id,
    account,
    vault,
  );

  const allActivity = useMemo(() => {
    return activityData?.activities || [];
  }, [activityData]);

  if (activityFetching) {
    return <Fieldset legend="🐝 Activity">Loading...</Fieldset>;
  }

  if (allActivity.length === 0) {
    return <Fieldset legend="🐝 Activity">No activity yet</Fieldset>;
  }

  return (
    <Fieldset legend="🐝 Activity">
      <Table>
        <tbody className={styles.table}>
          {allActivity.map((activity) => {
            switch (true) {
              case activityIsAddCollateral(activity):
                return (
                  <CollateralAdded
                    activity={activity}
                    paprController={paprController}
                    key={activity.id}
                  />
                );
              case activityIsRemoveCollateral(activity):
                return (
                  <CollateralRemoved
                    activity={activity}
                    paprController={paprController}
                    key={activity.id}
                  />
                );
              case activityIsSwap(activity):
                return <Swap key={activity.id} activity={activity} />;
              case activityIsAuctionStart(activity):
                return <AuctionStart activity={activity} key={activity.id} />;
              case activityIsAuctionEnd(activity):
                return (
                  <AuctionEnd
                    activity={activity}
                    key={activity.id}
                    paprController={paprController}
                  />
                );
            }
          })}
        </tbody>
      </Table>
    </Fieldset>
  );
}

function CollateralAdded({
  activity,
  paprController,
}: {
  activity: ActivityType;
  paprController: PaprController;
}) {
  const vaultOwner = useMemo(() => {
    const vaultId = activity.vault!.id;
    return vaultId.split('-')[1];
  }, [activity.vault]);

  const borrowedAmount = useMemo(() => {
    if (!activity.amountBorrowed) return null;
    const bigNumAmount = ethers.utils.formatUnits(
      activity.amountBorrowed,
      paprController.paprToken.decimals,
    );
    return (
      formatTokenAmount(parseFloat(bigNumAmount)) +
      ` ${paprController.paprToken.symbol}`
    );
  }, [activity.amountBorrowed, paprController.paprToken]);

  return (
    <tr>
      <td>
        <EtherscanTransactionLink transactionHash={activity.id}>
          {humanizedTimestamp(activity.timestamp)}
        </EtherscanTransactionLink>
      </td>
      <td>
        <span>
          <EtherscanAddressLink address={vaultOwner}>
            <DisplayAddress
              address={vaultOwner}
              displayType={DisplayAddressType.TRUNCATED}
            />
          </EtherscanAddressLink>{' '}
          deposited {activity.vault!.token.symbol} #
          {activity.addedCollateral[0].tokenId} and minted{' '}
          {borrowedAmount || 'nothing'}
        </span>
      </td>
    </tr>
  );
}

function CollateralRemoved({
  activity,
  paprController,
}: {
  activity: ActivityType;
  paprController: PaprController;
}) {
  const vaultOwner = useMemo(() => {
    const vaultId = activity.vault!.id;
    return vaultId.split('-')[1];
  }, [activity.vault]);

  const returnedAmount = useMemo(() => {
    if (!activity.amountRepaid) {
      return '';
    }
    const bigNumAmount = ethers.utils.formatUnits(
      activity.amountRepaid,
      paprController.paprToken.decimals,
    );
    return (
      formatTokenAmount(parseFloat(bigNumAmount)) +
      ` ${paprController.paprToken.symbol}`
    );
  }, [activity.amountRepaid, paprController.paprToken]);

  if (!returnedAmount) {
    return (
      <tr>
        <td>
          <EtherscanTransactionLink transactionHash={activity.id}>
            {humanizedTimestamp(activity.timestamp)}
          </EtherscanTransactionLink>
        </td>
        <td>
          <span>
            {activity.vault!.token.symbol} #
            {activity.removedCollateral[0].tokenId} transferred to{' '}
            <EtherscanAddressLink address={vaultOwner}>
              {vaultOwner.substring(0, 8)}
            </EtherscanAddressLink>{' '}
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <EtherscanTransactionLink transactionHash={activity.id}>
          {humanizedTimestamp(activity.timestamp)}
        </EtherscanTransactionLink>
      </td>
      <td>
        <span>
          <EtherscanAddressLink address={vaultOwner}>
            {vaultOwner.substring(0, 8)}
          </EtherscanAddressLink>{' '}
          repaid {returnedAmount} and withdrew {activity.vault!.token.symbol} #
          {activity.removedCollateral[0].tokenId}
        </span>
      </td>
    </tr>
  );
}

function Swap({ activity }: { activity: ActivityType }) {
  const description = useMemo(() => {
    const amountInFormatted = formatBigNum(
      ethers.BigNumber.from(activity.amountIn),
      activity.tokenIn!.decimals,
    );
    const amountOutFormatted = formatBigNum(
      ethers.BigNumber.from(activity.amountOut),
      activity.tokenOut!.decimals,
    );

    return `${amountInFormatted} ${
      activity.tokenIn!.symbol
    } traded for ${amountOutFormatted} ${activity.tokenOut!.symbol}`;
  }, [activity]);
  return (
    <tr>
      <td>
        <EtherscanTransactionLink transactionHash={activity.id}>
          {humanizedTimestamp(activity.timestamp)}
        </EtherscanTransactionLink>
      </td>
      <td>
        <span>{description}</span>
      </td>
    </tr>
  );
}

function AuctionStart({ activity }: { activity: ActivityType }) {
  const symbol = useMemo(
    () => activity.auctionCollateral!.symbol,
    [activity.auctionCollateral],
  );

  return (
    <tr>
      <td>
        <EtherscanTransactionLink transactionHash={activity.id}>
          {humanizedTimestamp(activity.timestamp)}
        </EtherscanTransactionLink>
      </td>
      <td>
        Auction: {symbol} #{activity.auctionTokenId}
      </td>
    </tr>
  );
}

function AuctionEnd({
  activity,
  paprController,
}: {
  activity: ActivityType;
  paprController: PaprController;
}) {
  const symbol = useMemo(
    () => activity.auctionCollateral!.symbol,
    [activity.auctionCollateral],
  );
  const formattedEndPrice = useMemo(() => {
    const endPrice = ethers.utils.formatUnits(
      ethers.BigNumber.from(activity.auctionEndPrice),
      paprController.paprToken.decimals,
    );
    return formatTokenAmount(parseFloat(endPrice));
  }, [activity, paprController.paprToken]);

  return (
    <tr>
      <td>
        <EtherscanTransactionLink transactionHash={activity.id}>
          {humanizedTimestamp(activity.timestamp)}
        </EtherscanTransactionLink>
      </td>
      <td>
        Auction completed: {symbol} #{activity.auctionTokenId} for{' '}
        {formattedEndPrice} papr.
      </td>
    </tr>
  );
}
