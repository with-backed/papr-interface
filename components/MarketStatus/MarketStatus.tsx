import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { formatTokenAmount } from 'lib/numberFormat';

import styles from './MarketStatus.module.css';
import { Sparkline } from './Sparkline';

const CustomFieldset: React.FunctionComponent = ({ children }) => (
  <Fieldset legend="📈 Market Status">{children}</Fieldset>
);

export function MarketStatus() {
  const { pricesData, fetching, error } = useControllerPricesData();

  if (error) {
    return <MarketStatusError />;
  }

  if (fetching) {
    return <MarketStatusFetching />;
  }

  return (
    <CustomFieldset>
      <div className={styles['market-status-wrapper']}>
        <Table className={styles.table}>
          <thead>
            <tr>
              <th>
                Market
                <br />
                Price
              </th>
              <th>
                7
                <br />
                Day
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
              <td>
                {formatTokenAmount(
                  pricesData.markValues[pricesData.markValues.length - 1].value,
                )}
              </td>
              <td>+0.02%</td>
              <td>+3.10%</td>
              <td>22.48%</td>
            </tr>
          </tbody>
        </Table>
        <Sparkline data={pricesData.markValues} />
      </div>
    </CustomFieldset>
  );
}

function MarketStatusError() {
  return <CustomFieldset>Error loading market price data.</CustomFieldset>;
}

function MarketStatusFetching() {
  return <CustomFieldset>Loading market price data...</CustomFieldset>;
}
