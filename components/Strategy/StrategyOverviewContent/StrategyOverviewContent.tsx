import React from 'react';
import styles from 'components/Strategy/Strategy.module.css';
import { StrategyPricesData } from 'lib/strategies/charts';
import { AssociatedVaults } from '../AssociatedVaults';
import { Charts } from 'components/Strategy/Charts';
import { LendingStrategy } from 'lib/LendingStrategy';
import { Collateral } from '../Collateral';
import { Activity } from '../Activity';
import { Loans } from '../Loans';

export type StrategyPageProps = {
  address: string;
  lendingStrategy: LendingStrategy;
  pricesData: StrategyPricesData | null;
};

export function StrategyOverviewContent({
  address,
  lendingStrategy,
  pricesData,
}: StrategyPageProps) {
  return (
    <div className={styles.wrapper}>
      <AssociatedVaults strategy={address} />
      <Charts pricesData={pricesData} />
      <Collateral lendingStrategy={lendingStrategy} />
      <Activity lendingStrategy={lendingStrategy} />
      <Loans lendingStrategy={lendingStrategy} />
    </div>
  );
}
