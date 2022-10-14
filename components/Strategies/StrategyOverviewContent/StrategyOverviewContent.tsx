import React from 'react';
import styles from 'components/Strategies/Strategy.module.css';
import { StrategyPricesData } from 'lib/strategies/charts';
import { LendingStrategy } from 'lib/LendingStrategy';
import { Collateral } from 'components/Strategies/Collateral';
import { Activity } from 'components/Strategies/Activity';
import { Loans } from 'components/Strategies/Loans';
import StrategySummary from 'components/StrategySummary/StrategySummary';
import dynamic from 'next/dynamic';
import { YourPositions } from 'components/Strategies/YourPositions';

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
  const latestMarketPrice =
    pricesData?.markValues[pricesData?.markValues.length - 1].value;

  return (
    <div className={styles.wrapper}>
      <YourPositions
        lendingStrategy={lendingStrategy}
        latestMarketPrice={latestMarketPrice}
      />
      <StrategySummary
        includeDetails={false}
        legend="📈 Token Performance"
        pricesData={{ [lendingStrategy.id]: pricesData }}
        strategies={[lendingStrategy]}
      />
      <Collateral lendingStrategy={lendingStrategy} />
      <Activity lendingStrategy={lendingStrategy} />
      <Charts pricesData={pricesData} />
      <Loans lendingStrategy={lendingStrategy} pricesData={pricesData} />
    </div>
  );
}
