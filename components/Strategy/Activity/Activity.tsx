import {
  EtherscanAddressLink,
  EtherscanTransactionLink,
} from 'components/EtherscanLink';
import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { humanizedTimestamp } from 'lib/duration';
import { LendingStrategy } from 'lib/LendingStrategy';
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

const uniswapURL =
  'https://api.thegraph.com/subgraphs/name/liqwiz/uniswap-v3-goerli';

export function Activity({ lendingStrategy }: ActivityProps) {
  const [{ data: swapsData, fetching: swapsFetching, error }] =
    useQuery<SwapsByPoolQuery>({
      query: SwapsByPoolDocument,
      variables: { pool: lendingStrategy.poolAddress },
      context: useMemo(
        () => ({
          url: uniswapURL,
        }),
        [],
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
                return <CollateralRemoved event={event} key={event.id} />;
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
    return ethers.utils.formatUnits(
      debtIncreasedEvent?.amount,
      lendingStrategy.token0IsUnderlying
        ? lendingStrategy.subgraphPool.token0.decimals
        : lendingStrategy.subgraphPool.token1.decimals,
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
          deposited #{event.collateral.tokenId} and borrowed {borrowedAmount}
        </span>
      </td>
    </tr>
  );
}

function CollateralRemoved({}: {
  event: ArrayElement<ActivityByStrategyQuery['removeCollateralEvents']>;
}) {
  return <div>Collateral removed</div>;
}

function Swap({
  event,
  lendingStrategy,
}: {
  event: ArrayElement<SwapsByPoolQuery['swaps']>;
  lendingStrategy: LendingStrategy;
}) {
  const description = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    });
    const amount0 = formatter.format(Math.abs(event.amount0));
    const amount1 = formatter.format(Math.abs(event.amount1));
    const token0Symbol = lendingStrategy.subgraphPool.token0.symbol;
    const token1Symbol = lendingStrategy.subgraphPool.token1.symbol;

    if (event.amount0 < 0) {
      return `${amount0} ${token0Symbol} sold for ${amount1} ${token1Symbol}`;
    }
    return `${amount1} ${token1Symbol} sold for ${amount0} ${token0Symbol}`;
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
