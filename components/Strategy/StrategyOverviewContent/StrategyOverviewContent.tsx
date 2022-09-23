import React from 'react';
import styles from 'components/Strategy/Strategy.module.css';
import { LendingStrategyByIdQuery } from 'types/generated/graphql/inKindSubgraph';
import { StrategyPricesData } from 'lib/strategies/charts';
import { AssociatedVaults } from '../AssociatedVaults';
import { Charts } from 'components/Strategy/Charts';

export type StrategyPageProps = {
  address: string;
  subgraphLendingStrategy: NonNullable<
    LendingStrategyByIdQuery['lendingStrategy']
  >;
  pricesData: StrategyPricesData | null;
};

export function StrategyOverviewContent({
  address,
  subgraphLendingStrategy,
  pricesData,
}: StrategyPageProps) {
  console.log({ subgraphLendingStrategy });
  return (
    <div className={styles.wrapper}>
      <AssociatedVaults strategy={address} />
      <Charts pricesData={pricesData} />
    </div>
  );
}
