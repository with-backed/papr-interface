import React, { useCallback, useEffect, useState } from 'react';
import styles from 'components/Strategy/Strategy.module.css';
import { LendingStrategyByIdQuery } from 'types/generated/graphql/inKindSubgraph';
import { StrategyPricesData } from 'lib/strategies/charts';
import { useConfig } from 'hooks/useConfig';
import { LendingStrategy, populateLendingStrategy } from 'lib/strategies';
import { AssociatedVaults } from '../AssociatedVaults';
import { StrategyCharts } from 'components/Strategy/Charts';

export type StrategyPageProps = {
  address: string;
  subgraphLendingStrategy: NonNullable<
    LendingStrategyByIdQuery['lendingStrategy']
  >;
  pricesData: StrategyPricesData | null;
};

// TODO: make this real
const PRICE = 20_000;

export function StrategyOverviewContent({
  address,
  subgraphLendingStrategy,
  pricesData,
}: StrategyPageProps) {
  const config = useConfig();
  const [lendingStrategy, setLendingStrategy] =
    useState<LendingStrategy | null>(null);

  const populate = useCallback(async () => {
    const s = await populateLendingStrategy(address, config);
    setLendingStrategy(s);
  }, [address, config]);

  useEffect(() => {
    populate();
  }, [populate]);

  return (
    <div className={styles.wrapper}>
      <AssociatedVaults strategy={address} />
      <StrategyCharts pricesData={pricesData} />
    </div>
  );
}
