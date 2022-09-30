import {
  EtherscanAddressLink,
  EtherscanTransactionLink,
} from 'components/EtherscanLink';
import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { humanizedTimestamp } from 'lib/duration';
import { LendingStrategy } from 'lib/LendingStrategy';
import { formatTokenAmount } from 'lib/numberFormat';
import React, { useMemo } from 'react';
import {
  ActivityByStrategyDocument,
  ActivityByStrategyQuery,
} from 'types/generated/graphql/inKindSubgraph';
import {
  SwapsByPoolDocument,
  SwapsByPoolQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';
import styles from './Activity.module.css';

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

type ActivityProps = {
  lendingStrategy: LendingStrategy;
};

export function Activity({ lendingStrategy }: ActivityProps) {
  const { uniswapSubgraph } = useConfig();
  const [{ data: swapsData, fetching: swapsFetching, error }] =
    useQuery<SwapsByPoolQuery>({
      query: SwapsByPoolDocument,
      variables: { pool: lendingStrategy.poolAddress },
      context: useMemo(
        () => ({
          url: uniswapSubgraph,
        }),
        [uniswapSubgraph],
      ),
    });

  const [{ data: activityData, fetching: activityFetching }] =
    useQuery<ActivityByStrategyQuery>({
      query: ActivityByStrategyDocument,
      variables: { strategyId: lendingStrategy.id },
    });

  const feed = useMemo(() => {
    const unsortedEvents = [
      ...(activityData?.addCollateralEvents || []),
      ...(activityData?.debtDecreasedEvents || []),
      ...(activityData?.debtIncreasedEvents || []),
      ...(activityData?.removeCollateralEvents || []),
      ...(swapsData?.swaps || []),
    ];
    return unsortedEvents.sort((a, b) => b.timestamp - a.timestamp);
  }, [activityData, swapsData]);

  if (swapsFetching || activityFetching) {
    return <Fieldset legend="🐝 Activity">Loading...</Fieldset>;
  }

  if (feed.length === 0) {
    return <Fieldset legend="🐝 Activity">No activity yet</Fieldset>;
  }

  return (
    <Fieldset legend="🐝 Activity">
      <table className={styles.table}>
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
                    lendingStrategy={lendingStrategy}
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
                    lendingStrategy={lendingStrategy}
                    key={event.id}
                  />
                );
              case 'Swap':
                return (
                  <Swap
                    event={event}
                    key={event.id}
                    lendingStrategy={lendingStrategy}
                  />
                );
            }
          })}
        </tbody>
      </table>
    </Fieldset>
  );
}

function CollateralAdded({
  event,
  debtIncreasedEvents,
  lendingStrategy,
}: {
  event: ArrayElement<ActivityByStrategyQuery['addCollateralEvents']>;
  debtIncreasedEvents: ActivityByStrategyQuery['debtIncreasedEvents'];
  lendingStrategy: LendingStrategy;
}) {
  const vaultOwner = useMemo(() => {
    const vaultId = event.vault.id;
    const vault = lendingStrategy.vaults?.find((v) => v.id === vaultId);

    if (!vault) {
      return 'Unknown';
    }

    return vault.owner.id;
  }, [event, lendingStrategy]);

  const debtIncreasedEvent = useMemo(() => {
    return debtIncreasedEvents.find((e) => e.txHash === event.txHash);
  }, [debtIncreasedEvents, event]);

  const borrowedAmount = useMemo(() => {
    const bigNumAmount = ethers.utils.formatUnits(
      debtIncreasedEvent?.amount,
      lendingStrategy.token0IsUnderlying
        ? lendingStrategy.subgraphPool.token0.decimals
        : lendingStrategy.subgraphPool.token1.decimals,
    );
    return (
      formatTokenAmount(parseFloat(bigNumAmount)) +
      ` ${lendingStrategy.underlying.symbol}`
    );
  }, [debtIncreasedEvent, lendingStrategy]);

  return (
    <tr>
      <td>
        <EtherscanTransactionLink transactionHash={event.txHash}>
          {humanizedTimestamp(event.timestamp)}
        </EtherscanTransactionLink>
      </td>
      <td>
        <span>
          <EtherscanAddressLink address={vaultOwner}>
            {vaultOwner.substring(0, 8)}
          </EtherscanAddressLink>{' '}
          deposited {event.collateral.symbol} #{event.collateral.tokenId} and
          borrowed {borrowedAmount}
        </span>
      </td>
    </tr>
  );
}

function CollateralRemoved({
  event,
  lendingStrategy,
  debtDecreasedEvents,
}: {
  event: ArrayElement<ActivityByStrategyQuery['removeCollateralEvents']>;
  debtDecreasedEvents: ActivityByStrategyQuery['debtDecreasedEvents'];
  lendingStrategy: LendingStrategy;
}) {
  const vaultOwner = useMemo(() => {
    const vaultId = event.vault.id;
    const vault = lendingStrategy.vaults?.find((v) => v.id === vaultId);

    if (!vault) {
      return 'Unknown';
    }

    return vault.owner.id;
  }, [event, lendingStrategy]);

  const debtDecreasedEvent = useMemo(() => {
    return debtDecreasedEvents.find((e) => e.txHash === event.txHash);
  }, [debtDecreasedEvents, event]);

  const returnedAmount = useMemo(() => {
    const bigNumAmount = ethers.utils.formatUnits(
      debtDecreasedEvent?.amount,
      lendingStrategy.token0IsUnderlying
        ? lendingStrategy.subgraphPool.token0.decimals
        : lendingStrategy.subgraphPool.token1.decimals,
    );
    return (
      formatTokenAmount(parseFloat(bigNumAmount)) +
      ` ${lendingStrategy.underlying.symbol}`
    );
  }, [debtDecreasedEvent, lendingStrategy]);

  return (
    <tr>
      <td>
        <EtherscanTransactionLink transactionHash={event.txHash}>
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
  lendingStrategy,
}: {
  event: ArrayElement<SwapsByPoolQuery['swaps']>;
  lendingStrategy: LendingStrategy;
}) {
  const description = useMemo(() => {
    const amount0 = formatTokenAmount(Math.abs(event.amount0));
    const amount1 = formatTokenAmount(Math.abs(event.amount1));
    const token0Symbol = lendingStrategy.subgraphPool.token0.symbol;
    const token1Symbol = lendingStrategy.subgraphPool.token1.symbol;

    if (event.amount0 < 0) {
      return `${amount0} ${token0Symbol} traded for ${amount1} ${token1Symbol}`;
    }
    return `${amount1} ${token1Symbol} traded for ${amount0} ${token0Symbol}`;
  }, [event, lendingStrategy]);
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
