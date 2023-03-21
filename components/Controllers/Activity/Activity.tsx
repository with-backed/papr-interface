import { TextButton } from 'components/Button';
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

import styles from './Activity.module.css';

type ActivityProps = {
  // If scoping activity view to just a specific account
  account?: string;
  // If scoping activity view to just a specific vault
  vault?: string;
  showSwaps?: boolean;
};

const LIMIT = 5;

function activityIsSwap(activity: ActivityType) {
  return !!activity.amountIn && !!activity.amountOut;
}

function activityIsAddCollateral(activity: ActivityType) {
  return activity.addedCollateral.length > 0 || !!activity.amountBorrowed;
}

function activityIsRemoveCollateral(activity: ActivityType) {
  return activity.removedCollateral.length > 0 || !!activity.amountRepaid;
}

function activityIsAuctionStart(activity: ActivityType) {
  return !!activity.auctionTokenId && !activity.auctionEndPrice;
}

function activityIsAuctionEnd(activity: ActivityType) {
  return !!activity.auctionTokenId && !!activity.auctionEndPrice;
}

export function Activity({ account, vault, showSwaps = true }: ActivityProps) {
  const paprController = useController();

  const {
    data: activityData,
    fetching: activityFetching,
    fetchMore,
    remaining,
  } = useActivity(paprController.id, account, vault, LIMIT);

  if (activityFetching && activityData.length === 0) {
    return <Fieldset legend="🐝 Activity">Loading...</Fieldset>;
  }

  if (!activityFetching && activityData.length === 0) {
    return <Fieldset legend="🐝 Activity">No activity yet</Fieldset>;
  }

  return (
    <Fieldset legend="🐝 Activity">
      <Table>
        <tbody className={styles.table}>
          {activityData.map((activity) => {
            switch (true) {
              case activityIsAuctionStart(activity):
                return <AuctionStart key={activity.id} activity={activity} />;
              case activityIsAuctionEnd(activity):
                return (
                  <AuctionEnd
                    key={activity.id}
                    activity={activity}
                    paprController={paprController}
                  />
                );
              case activityIsAddCollateral(activity):
                return (
                  <CollateralAdded
                    key={activity.id}
                    activity={activity}
                    paprController={paprController}
                  />
                );
              case activityIsRemoveCollateral(activity):
                return (
                  <CollateralRemoved
                    key={activity.id}
                    activity={activity}
                    paprController={paprController}
                  />
                );
              case activityIsSwap(activity) && showSwaps:
                return <Swap key={activity.id} activity={activity} />;
            }
          })}
        </tbody>
      </Table>
      {remaining && (
        <div className={styles['button-container']}>
          <TextButton kind="clickable" onClick={fetchMore}>
            {!activityFetching && `Load ${LIMIT} more`}
            {activityFetching && '...'}
          </TextButton>
        </div>
      )}
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
  const vault = useMemo(() => {
    return activity.vault!;
  }, [activity.vault]);

  const vaultOwner = useMemo(() => {
    const vaultId = vault.id;
    return vaultId.split('-')[1];
  }, [vault.id]);

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

  const collateralDescription = useMemo(() => {
    if (activity.addedCollateral.length === 0) return '';
    const baseString = `deposited ${vault.token.symbol}`;
    const tokenIds = activity.addedCollateral
      .map((collateral) => {
        return `#${collateral.tokenId}`;
      })
      .join(', ');
    return `${baseString} ${tokenIds}`;
  }, [activity.addedCollateral, vault.token.symbol]);

  const mintedDescription = useMemo(() => {
    if (!borrowedAmount) return '';
    if (!collateralDescription) return ` minted ${borrowedAmount}`;
    if (!activity.amountIn) return ` and minted ${borrowedAmount}`;

    const amountOutFormatted = formatBigNum(
      activity.amountOut,
      activity.tokenOut!.decimals,
      3,
    );
    return ` minted ${borrowedAmount} and traded it for ${amountOutFormatted} ${
      activity.tokenOut!.symbol
    }`;
  }, [
    collateralDescription,
    activity.amountIn,
    borrowedAmount,
    activity.tokenOut,
    activity.amountOut,
  ]);

  const fullDescription = useMemo(
    () => `${collateralDescription}${mintedDescription}`,
    [collateralDescription, mintedDescription],
  );

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
          {fullDescription}
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
  const vault = useMemo(() => {
    return activity.vault!;
  }, [activity.vault]);

  const vaultOwner = useMemo(() => {
    const vaultId = vault.id;
    return vaultId.split('-')[1];
  }, [vault.id]);

  const repaidAmount = useMemo(() => {
    if (!activity.amountRepaid) return null;
    const bigNumAmount = ethers.utils.formatUnits(
      activity.amountRepaid,
      paprController.paprToken.decimals,
    );
    return (
      formatTokenAmount(parseFloat(bigNumAmount)) +
      ` ${paprController.paprToken.symbol}`
    );
  }, [activity.amountRepaid, paprController.paprToken]);

  const collateralDescription = useMemo(() => {
    if (activity.removedCollateral.length === 0) return '';

    let baseString: string;
    if (!repaidAmount) baseString = `withdrew ${vault.token.symbol}`;
    else baseString = ` and withdrew ${vault.token.symbol}`;

    const tokenIds = activity.removedCollateral
      .map((collateral) => {
        return `#${collateral.tokenId}`;
      })
      .join(', ');
    return `${baseString} ${tokenIds}`;
  }, [activity.removedCollateral, vault.token.symbol, repaidAmount]);

  const repaidDescription = useMemo(() => {
    if (!repaidAmount) return '';
    if (!activity.amountIn) return ` repaid ${repaidAmount}`;

    const amountInFormatted = formatBigNum(
      activity.amountIn,
      activity.amountIn.decimals,
      3,
    );
    return ` swapped ${amountInFormatted} ${
      activity.tokenIn!.symbol
    } to repay ${repaidAmount}`;
  }, [activity.amountIn, repaidAmount, activity.tokenIn]);

  const fullDescription = useMemo(
    () => `${repaidDescription}${collateralDescription}`,
    [collateralDescription, repaidDescription],
  );

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
          {fullDescription}
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
      3,
    );
    const amountOutFormatted = formatBigNum(
      ethers.BigNumber.from(activity.amountOut),
      activity.tokenOut!.decimals,
      3,
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
