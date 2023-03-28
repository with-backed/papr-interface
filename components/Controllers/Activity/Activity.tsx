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

function activityIsLPModified(activity: ActivityType) {
  return !!activity.liquidityDelta;
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
            if (activityIsAuctionStart(activity)) {
              return <AuctionStart key={activity.id} activity={activity} />;
            } else if (activityIsAuctionEnd(activity)) {
              return (
                <AuctionEnd
                  key={activity.id}
                  activity={activity}
                  paprController={paprController}
                />
              );
            } else if (activityIsAddCollateral(activity)) {
              return (
                <CollateralAdded
                  key={activity.id}
                  activity={activity}
                  paprController={paprController}
                />
              );
            } else if (activityIsRemoveCollateral(activity)) {
              return (
                <CollateralRemoved
                  key={activity.id}
                  activity={activity}
                  paprController={paprController}
                />
              );
            } else if (activityIsSwap(activity) && showSwaps) {
              return <Swap key={activity.id} activity={activity} />;
            } else if (activityIsLPModified(activity)) {
              return (
                <LPModified
                  key={activity.id}
                  activity={activity}
                  paprController={paprController}
                />
              );
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

    const baseString = repaidAmount
      ? ` and withdrew ${vault.token.symbol}`
      : `withdrew ${vault.token.symbol}`;

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

function LPModified({
  activity,
  paprController,
}: {
  activity: ActivityType;
  paprController: PaprController;
}) {
  const isLiquidityRemoved = useMemo(() => {
    return ethers.BigNumber.from(activity.liquidityDelta!).lt(0);
  }, [activity.liquidityDelta]);

  const formattedPaprAdded = useMemo(() => {
    if (paprController.token0IsUnderlying) {
      return formatBigNum(
        ethers.BigNumber.from(activity.token1Delta!),
        paprController.paprToken.decimals,
        3,
      );
    } else {
      return formatBigNum(
        ethers.BigNumber.from(activity.token0Delta!),
        paprController.paprToken.decimals,
        3,
      );
    }
  }, [
    activity.token0Delta,
    activity.token1Delta,
    paprController.paprToken.decimals,
    paprController.token0IsUnderlying,
  ]);
  const formattedUnderlyingAdded = useMemo(() => {
    if (paprController.token0IsUnderlying) {
      return formatBigNum(
        ethers.BigNumber.from(activity.token0Delta!),
        paprController.underlying.decimals,
        3,
      );
    } else {
      return formatBigNum(
        ethers.BigNumber.from(activity.token1Delta!),
        paprController.underlying.decimals,
        3,
      );
    }
  }, [
    activity.token0Delta,
    activity.token1Delta,
    paprController.underlying.decimals,
    paprController.token0IsUnderlying,
  ]);

  return (
    <tr>
      <td>
        <EtherscanTransactionLink transactionHash={activity.id}>
          {humanizedTimestamp(activity.timestamp)}
        </EtherscanTransactionLink>
      </td>
      <td>
        <EtherscanAddressLink address={activity.user}>
          {activity.user.substring(0, 8)}
        </EtherscanAddressLink>{' '}
        {isLiquidityRemoved ? 'removed' : 'added '} liquidity:{' '}
        {formattedPaprAdded} {paprController.paprToken.symbol} and{' '}
        {formattedUnderlyingAdded} {paprController.underlying.symbol}
      </td>
    </tr>
  );
}
