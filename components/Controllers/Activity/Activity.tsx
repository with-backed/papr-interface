import { TextButton } from 'components/Button';
import {
  EtherscanAddressLink,
  EtherscanTransactionLink,
} from 'components/EtherscanLink';
import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useActivityByController } from 'hooks/useActivityByController';
import { useUniswapSwapsByPool } from 'hooks/useUniswapSwapsByPool';
import { humanizedTimestamp } from 'lib/duration';
import { PaprController } from 'lib/PaprController';
import { formatTokenAmount } from 'lib/numberFormat';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityByControllerQuery } from 'types/generated/graphql/inKindSubgraph';
import { SwapsByPoolQuery } from 'types/generated/graphql/uniswapSubgraph';
import styles from './Activity.module.css';
import { Table } from 'components/Table';

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

type ActivityProps = {
  paprController: PaprController;
  // If scoping activity view to just a specific vault
  // instead of the whole controller
  vaultId?: string;
};

const EVENT_INCREMENT = 5;

export function Activity({ paprController, vaultId }: ActivityProps) {
  const { data: swapsData, fetching: swapsFetching } = useUniswapSwapsByPool(
    paprController.poolAddress,
  );

  const { data: activityData, fetching: activityFetching } =
    useActivityByController(paprController.id);

  const allEvents = useMemo(() => {
    const unsortedEvents = vaultId
      ? [
          ...(activityData?.addCollateralEvents.filter(
            (e) => e.vault.id === vaultId,
          ) || []),
          ...(activityData?.removeCollateralEvents.filter(
            (e) => e.vault.id === vaultId,
          ) || []),
        ]
      : [
          ...(activityData?.addCollateralEvents || []),
          ...(activityData?.removeCollateralEvents || []),
          ...(swapsData?.swaps || []),
        ];
    return unsortedEvents.sort((a, b) => b.timestamp - a.timestamp);
  }, [activityData, swapsData, vaultId]);

  const [feed, setFeed] = useState<typeof allEvents>([]);
  const [remaining, setRemaining] = useState<typeof allEvents>([]);

  const handleShowMore = useCallback(() => {
    const nextFive = remaining.slice(0, EVENT_INCREMENT);
    setRemaining((prev) => prev.slice(EVENT_INCREMENT));
    setFeed((prev) => prev.concat(nextFive));
  }, [remaining]);

  useEffect(() => {
    if (allEvents.length > 0) {
      setFeed(allEvents.slice(0, EVENT_INCREMENT));
      setRemaining(allEvents.slice(EVENT_INCREMENT));
    }
  }, [allEvents]);

  if (swapsFetching || activityFetching) {
    return <Fieldset legend="🐝 Activity">Loading...</Fieldset>;
  }

  if (allEvents.length === 0) {
    return <Fieldset legend="🐝 Activity">No activity yet</Fieldset>;
  }

  return (
    <Fieldset legend="🐝 Activity">
      <Table>
        <tbody>
          {feed.map((event) => {
            switch (event.__typename) {
              case 'AddCollateralEvent':
                return (
                  <CollateralAdded
                    event={event}
                    debtIncreasedEvents={
                      activityData?.debtIncreasedEvents || []
                    }
                    paprController={paprController}
                    key={event.id}
                  />
                );
              case 'RemoveCollateralEvent':
                return (
                  <CollateralRemoved
                    event={event}
                    debtDecreasedEvents={
                      activityData?.debtDecreasedEvents || []
                    }
                    paprController={paprController}
                    key={event.id}
                  />
                );
              case 'Swap':
                return (
                  <Swap
                    event={event}
                    key={event.id}
                    paprController={paprController}
                  />
                );
            }
          })}
        </tbody>
      </Table>
      {remaining.length > 0 && (
        <div className={styles['button-container']}>
          <TextButton kind="clickable" onClick={handleShowMore}>
            Load {Math.min(EVENT_INCREMENT, remaining.length)} more (of{' '}
            {remaining.length})
          </TextButton>
        </div>
      )}
    </Fieldset>
  );
}

function CollateralAdded({
  event,
  debtIncreasedEvents,
  paprController,
}: {
  event: ArrayElement<ActivityByControllerQuery['addCollateralEvents']>;
  debtIncreasedEvents: ActivityByControllerQuery['debtIncreasedEvents'];
  paprController: PaprController;
}) {
  const vaultOwner = useMemo(() => {
    const vaultId = event.vault.id;
    const vault = paprController.vaults?.find((v) => v.id === vaultId);

    if (!vault) {
      return 'Unknown';
    }

    return vault.id;
  }, [event, paprController]);

  const debtIncreasedEvent = useMemo(() => {
    return debtIncreasedEvents.find((e) => e.id === event.id);
  }, [debtIncreasedEvents, event]);

  const borrowedAmount = useMemo(() => {
    if (!debtIncreasedEvent) return null;
    const bigNumAmount = ethers.utils.formatUnits(
      debtIncreasedEvent?.amount,
      paprController.token0IsUnderlying
        ? paprController.subgraphPool.token0.decimals
        : paprController.subgraphPool.token1.decimals,
    );
    return (
      formatTokenAmount(parseFloat(bigNumAmount)) +
      ` ${paprController.underlying.symbol}`
    );
  }, [debtIncreasedEvent, paprController]);

  return (
    <tr>
      <td>
        <EtherscanTransactionLink transactionHash={event.id}>
          {humanizedTimestamp(event.timestamp)}
        </EtherscanTransactionLink>
      </td>
      <td>
        <span>
          <EtherscanAddressLink address={vaultOwner}>
            {vaultOwner.substring(0, 8)}
          </EtherscanAddressLink>{' '}
          deposited {event.collateral.symbol} #{event.collateral.tokenId} and
          borrowed {borrowedAmount || 'nothing'}
        </span>
      </td>
    </tr>
  );
}

function CollateralRemoved({
  event,
  paprController,
  debtDecreasedEvents,
}: {
  event: ArrayElement<ActivityByControllerQuery['removeCollateralEvents']>;
  debtDecreasedEvents: ActivityByControllerQuery['debtDecreasedEvents'];
  paprController: PaprController;
}) {
  const vaultOwner = useMemo(() => {
    const vaultId = event.vault.id;
    const vault = paprController.vaults?.find((v) => v.id === vaultId);

    if (!vault) {
      return 'Unknown';
    }

    return vault.id;
  }, [event, paprController]);

  const debtDecreasedEvent = useMemo(() => {
    return debtDecreasedEvents.find((e) => e.id === event.id);
  }, [debtDecreasedEvents, event]);

  const returnedAmount = useMemo(() => {
    const bigNumAmount = ethers.utils.formatUnits(
      debtDecreasedEvent?.amount,
      paprController.token0IsUnderlying
        ? paprController.subgraphPool.token0.decimals
        : paprController.subgraphPool.token1.decimals,
    );
    return (
      formatTokenAmount(parseFloat(bigNumAmount)) +
      ` ${paprController.underlying.symbol}`
    );
  }, [debtDecreasedEvent, paprController]);

  return (
    <tr>
      <td>
        <EtherscanTransactionLink transactionHash={event.id}>
          {humanizedTimestamp(event.timestamp)}
        </EtherscanTransactionLink>
      </td>
      <td>
        <span>
          <EtherscanAddressLink address={vaultOwner}>
            {vaultOwner.substring(0, 8)}
          </EtherscanAddressLink>{' '}
          returned {returnedAmount} and reclaimed {event.collateral.symbol} #
          {event.collateral.tokenId}
        </span>
      </td>
    </tr>
  );
}

function Swap({
  event,
  paprController,
}: {
  event: ArrayElement<SwapsByPoolQuery['swaps']>;
  paprController: PaprController;
}) {
  const description = useMemo(() => {
    const amount0 = formatTokenAmount(Math.abs(event.amount0));
    const amount1 = formatTokenAmount(Math.abs(event.amount1));
    const token0Symbol = paprController.subgraphPool.token0.symbol;
    const token1Symbol = paprController.subgraphPool.token1.symbol;

    if (event.amount0 < 0) {
      return `${amount0} ${token0Symbol} traded for ${amount1} ${token1Symbol}`;
    }
    return `${amount1} ${token1Symbol} traded for ${amount0} ${token0Symbol}`;
  }, [event, paprController]);
  return (
    <tr>
      <td>
        <EtherscanTransactionLink transactionHash={event.transaction.id}>
          {humanizedTimestamp(event.timestamp)}
        </EtherscanTransactionLink>
      </td>
      <td>
        <span>{description}</span>
      </td>
    </tr>
  );
}
