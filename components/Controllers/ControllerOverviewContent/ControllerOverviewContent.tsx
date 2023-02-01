import { ContractStatus } from 'components/ContractStatus';
import { Activity } from 'components/Controllers/Activity';
import { Auctions } from 'components/Controllers/Auctions';
import { Collateral as CollateralComponent } from 'components/Controllers/Collateral';
import styles from 'components/Controllers/Controller.module.css';
import { Loans as LoansComponent } from 'components/Controllers/Loans';
import { MarketStatus } from 'components/MarketStatus';
import { PoolStats } from 'components/PoolStats';
import { YourPositions as YourPositionsComponent } from 'components/YourPositions';
import dynamic from 'next/dynamic';
import React, { ComponentProps } from 'react';
import { PoolByIdQuery } from 'types/generated/graphql/uniswapSubgraph';

/* lightweight-charts uses canvas and cannot be SSRed */
const Charts = dynamic(() => import('components/Controllers/Charts/Charts'), {
  ssr: false,
});
const YourPositions = dynamic<ComponentProps<typeof YourPositionsComponent>>(
  () => import('components/YourPositions').then((mod) => mod.YourPositions),
  {
    ssr: false,
  },
);
const Loans = dynamic<ComponentProps<typeof LoansComponent>>(
  import('components/Controllers/Loans').then((mod) => mod.Loans),
  {
    ssr: false,
  },
);
const Collateral = dynamic<ComponentProps<typeof CollateralComponent>>(
  import('components/Controllers/Collateral').then((mod) => mod.Collateral),
  {
    ssr: false,
  },
);

export type ControllerPageProps = {
  subgraphPool: NonNullable<PoolByIdQuery['pool']>;
};

export function ControllerOverviewContent({
  subgraphPool,
}: ControllerPageProps) {
  return (
    <div className={styles.wrapper}>
      <YourPositions />
      <ContractStatus />
      <MarketStatus />
      <PoolStats />
      <Collateral />
      <Activity subgraphPool={subgraphPool} />
      <Charts />
      <Loans />
      <Auctions />
    </div>
  );
}
