import { Chart } from 'components/Chart';
import { Fieldset } from 'components/Fieldset';
import { StrategyPricesData } from 'lib/strategies/charts';
import React from 'react';
import styles from './StrategyCharts.module.css';

type StrategyChartsProps = {
  pricesData: StrategyPricesData;
};

export function StrategyCharts({ pricesData }: StrategyChartsProps) {
  return (
    <Fieldset legend="💸 Performance">
      <h3 className={styles.header}>Rate of Growth</h3>
      <Chart pricesData={pricesData} />
    </Fieldset>
  );
}
