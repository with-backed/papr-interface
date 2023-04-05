import { Activity } from 'components/Controllers/Activity';
import { Auctions } from 'components/Controllers/Auctions';
import styles from 'components/Controllers/Controller.module.css';
import dynamic from 'next/dynamic';
import React from 'react';

/* lightweight-charts uses canvas and cannot be SSRed */
const Charts = dynamic(() => import('components/Controllers/Charts/Charts'), {
  ssr: false,
});
const YourPositions = dynamic(
  () => import('components/YourPositions').then((mod) => mod.YourPositions),
  {
    ssr: false,
  },
);
const Loans = dynamic(
  import('components/Controllers/Loans').then((mod) => mod.Loans),
  {
    ssr: false,
  },
);
const Collateral = dynamic(
  import('components/Controllers/Collateral').then((mod) => mod.Collateral),
  {
    ssr: false,
  },
);
const ContractStatus = dynamic(
  import('components/ContractStatus').then((mod) => mod.ContractStatus),
);
const MarketStatus = dynamic(
  import('components/MarketStatus').then((mod) => mod.MarketStatus),
);
const PoolStats = dynamic(
  import('components/PoolStats').then((mod) => mod.PoolStats),
);

export function ControllerOverviewContent() {
  return (
    <div className={styles.wrapper}>
      <YourPositions onPerformancePage />
      <ContractStatus />
      <MarketStatus />
      <PoolStats />
      <Collateral />
      <Activity />
      <Charts />
      <Loans />
      <Auctions />
    </div>
  );
}
