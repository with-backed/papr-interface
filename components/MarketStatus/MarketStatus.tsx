import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { SECONDS_IN_A_DAY, SECONDS_IN_A_YEAR } from 'lib/constants';
import {
  formatPercent,
  formatPercentChange,
  formatTokenAmount,
} from 'lib/numberFormat';
import { percentChangeOverDuration } from 'lib/tokenPerformance';
import { useMemo } from 'react';

import styles from './MarketStatus.module.css';
import { Sparkline } from './Sparkline';

const CustomFieldset: React.FunctionComponent = ({ children, ...props }) => (
  <Fieldset legend="📈 Market Status" {...props}>
    {children}
  </Fieldset>
);

export function MarketStatus() {
  const { pricesData, fetching, error } = useControllerPricesData();

  const marketPrice = useMemo(
    () =>
      pricesData
        ? formatTokenAmount(
            pricesData.markValues[pricesData.markValues.length - 1].value,
          )
        : '???',
    [pricesData],
  );

  const { change24h, change30Days } = useMemo(() => {
    return {
      change24h: pricesData
        ? formatPercentChange(
            percentChangeOverDuration(pricesData.markValues, 1),
          )
        : '???',
      change30Days: pricesData
        ? formatPercentChange(
            percentChangeOverDuration(pricesData.markValues, 30),
          )
        : '???',
    };
  }, [pricesData]);

  const realizedAPR30Day = useMemo(() => {
    if (!pricesData) {
      return '???';
    }
    const change = percentChangeOverDuration(pricesData.markValues, 30);
    // convert to APR
    return formatPercent(
      (change / (SECONDS_IN_A_DAY * 30)) * SECONDS_IN_A_YEAR,
    );
  }, [pricesData]);

  if (error) {
    return <MarketStatusError />;
  }

  if (fetching) {
    return <MarketStatusFetching />;
  }

  return (
    <CustomFieldset>
      <div className={styles['market-status-wrapper']}>
        <div className={styles['table-flex-fix']}>
          <Table className={styles.table}>
            <thead>
              <tr>
                <th>
                  Market
                  <br />
                  Price
                </th>
                <th>
                  24
                  <br />
                  Hour
                </th>
                <th>
                  30
                  <br />
                  Day
                </th>
                <th>
                  30d rate
                  <br />
                  as APR
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{marketPrice}</td>
                <td data-change={change24h}>{change24h}</td>
                <td data-change={change30Days}>{change30Days}</td>
                <td>{realizedAPR30Day}</td>
              </tr>
            </tbody>
          </Table>
        </div>
        <Sparkline data={pricesData.markValues} />
      </div>
    </CustomFieldset>
  );
}

function MarketStatusError() {
  return (
    <CustomFieldset data-testid="market-status-error">
      Error loading market price data.
    </CustomFieldset>
  );
}

function MarketStatusFetching() {
  return (
    <CustomFieldset data-testid="market-status-fetching">
      Loading market price data...
    </CustomFieldset>
  );
}
