import React, { ComponentProps } from 'react';
import styles from 'components/Controllers/Controller.module.css';
import { ControllerPricesData } from 'lib/controllers/charts';
import { PaprController_deprecated } from 'lib/PaprController';
import { Collateral as CollateralComponent } from 'components/Controllers/Collateral';
import { Activity } from 'components/Controllers/Activity';
import { Loans as LoansComponent } from 'components/Controllers/Loans';
import { TokenPerformance } from 'components/Controllers/TokenPerformance';
import dynamic from 'next/dynamic';
import { Auctions } from 'components/Controllers/Auctions';
import { YourPositions as YourPositionsComponent } from 'components/YourPositions';
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
  paprController: PaprController_deprecated;
  pricesData: ControllerPricesData | null;
  subgraphPool: NonNullable<PoolByIdQuery['pool']>;
};

export function ControllerOverviewContent({
  paprController,
  pricesData,
  subgraphPool,
}: ControllerPageProps) {
  return (
    <div className={styles.wrapper}>
      <YourPositions />
      <TokenPerformance
        pricesData={{ [paprController.id]: pricesData }}
        controllers={[paprController]}
      />
      <Collateral paprController={paprController} />
      <Activity subgraphPool={subgraphPool} />
      <Charts pricesData={pricesData} />
      <Loans pricesData={pricesData} />
      <Auctions paprController={paprController} />
    </div>
  );
}
