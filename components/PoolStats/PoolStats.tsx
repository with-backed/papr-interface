import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { usePoolStats } from 'hooks/usePoolStats';

import styles from './PoolStats.module.css';

export function PoolStats() {
  const { fees24h, volume24h, totalVolume, totalValueLocked } = usePoolStats();
  return (
    <Fieldset legend="🦄 Pool Stats">
      <Table>
        <thead>
          <tr>
            <th>TVL</th>
            <th>Total Volume</th>
            <th>24H Volume</th>
            <th>24H LP Fees</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.row}>
            <td>{totalValueLocked}</td>
            <td>{totalVolume}</td>
            <td>{volume24h}</td>
            <td>{fees24h}</td>
          </tr>
        </tbody>
      </Table>
    </Fieldset>
  );
}
