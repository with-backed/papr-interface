import {
  EtherscanAddressLink,
  EtherscanTransactionLink,
} from 'components/EtherscanLink';
import { Fieldset } from 'components/Fieldset';
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

  console.log({ feed, swapsData, error });
  console.log(lendingStrategy.poolAddress);

  if (swapsFetching || activityFetching) {
    return <Fieldset legend="🐝 Activity">Loading...</Fieldset>;
  }

  if (feed.length === 0) {
    return <Fieldset legend="🐝 Activity">No activity yet</Fieldset>;
  }

  return (
    <Fieldset legend="🐝 Activity">
      <ul className={styles.feed}>
        {feed.map((event) => {
          switch (event.__typename) {
            case 'AddCollateralEvent':
              return (
                <CollateralAdded
                  event={event}
                  debtIncreasedEvents={activityData?.debtIncreasedEvents || []}
                  lendingStrategy={lendingStrategy}
                  key={event.id}
                />
              );
            case 'RemoveCollateralEvent':
              return <CollateralRemoved event={event} key={event.id} />;
            case 'Swap':
              return <Swap event={event} key={event.id} />;
          }
        })}
      </ul>
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

  console.log({ debtIncreasedEvents, hash: event.txHash });

  return (
    <li className={styles.event}>
      <EtherscanTransactionLink transactionHash={event.txHash}>
        {humanizedTimestamp(event.timestamp)}
      </EtherscanTransactionLink>
      <span>
        <EtherscanAddressLink address={vaultOwner}>
          {vaultOwner.substring(0, 8)}
        </EtherscanAddressLink>{' '}
        deposited #{event.collateral.tokenId} and borrowed $XX,XXX
      </span>
    </li>
  );
}

function CollateralRemoved({}: {
  event: ArrayElement<ActivityByStrategyQuery['removeCollateralEvents']>;
}) {
  return <div>Collateral removed</div>;
}

function DebtDecreased({}: {
  event: ArrayElement<ActivityByStrategyQuery['debtDecreasedEvents']>;
}) {
  return <div>debt decreased</div>;
}

function DebtIncreased({}: {
  event: ArrayElement<ActivityByStrategyQuery['debtIncreasedEvents']>;
}) {
  return <div>debt increased</div>;
}

function Swap({}: { event: ArrayElement<SwapsByPoolQuery['swaps']> }) {
  return <div>Swap</div>;
}
