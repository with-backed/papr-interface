import React from 'react';
import styles from 'components/Strategies/Strategy.module.css';
import { StrategyPricesData } from 'lib/strategies/charts';
import { LendingStrategy } from 'lib/LendingStrategy';
import { Collateral } from '../Collateral';
import { Activity } from '../Activity';
import { Loans } from '../Loans';
import StrategySummary from 'components/StrategySummary/StrategySummary';
import { useAsyncValue } from 'hooks/useAsyncValue';
import dynamic from 'next/dynamic';

/* lightweight-charts uses canvas and cannot be SSRed */
const Charts = dynamic(() => import('components/Strategies/Charts/Charts'), {
  ssr: false,
});

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
  const maxLTVPercent = useAsyncValue(
    () => lendingStrategy.maxLTVPercent(),
    [lendingStrategy],
  );
  return (
    <div className={styles.wrapper}>
      <StrategySummary
        includeDetails={false}
        legend={`Strategy: $papr_${lendingStrategy.debtToken.symbol}${maxLTVPercent}`}
        pricesData={{ [lendingStrategy.id]: pricesData }}
        strategies={[lendingStrategy]}
      />
      <Charts pricesData={pricesData} />
      <Collateral lendingStrategy={lendingStrategy} />
      <Activity lendingStrategy={lendingStrategy} />
      <Loans lendingStrategy={lendingStrategy} pricesData={pricesData} />
    </div>
  );
}
