import React, { useCallback, useEffect, useState } from 'react';
import styles from 'components/Strategy/Strategy.module.css';
import { LendingStrategyByIdQuery } from 'types/generated/graphql/inKindSubgraph';
import { StrategyPricesData } from 'lib/strategies/charts';
import { useConfig } from 'hooks/useConfig';
import { LendingStrategy, populateLendingStrategy } from 'lib/strategies';
import { StrategyCharts } from 'components/StrategyCharts';
import { Loans } from 'components/Strategy/Loans';

export type StrategyPageProps = {
  address: string;
  subgraphLendingStrategy: LendingStrategyByIdQuery['lendingStrategy'] | null;
  pricesData: StrategyPricesData | null;
};

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
    <div>
      {!!lendingStrategy && !!pricesData && (
        <div className={styles.wrapper}>
          <Loans strategy={address} />
          <StrategyCharts pricesData={pricesData} />
        </div>
      )}
    </div>
  );
}
