import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { usePoolStats } from 'hooks/usePoolStats';

import styles from './PoolStats.module.css';

export function PoolStats() {
  const { fees24h, volume24h, totalVolume, feeTier } = usePoolStats();
  return (
    <Fieldset legend="🦄 Pool Stats">
      <Table>
        <thead>
          <tr>
            <th>Total Volume</th>
            <th>24H Volume</th>
            <th>24H Fees</th>
            <th>LPs Earn</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.row}>
            <td>{totalVolume}</td>
            <td>{volume24h}</td>
            <td>{fees24h}</td>
            <td>{feeTier}</td>
          </tr>
        </tbody>
      </Table>
    </Fieldset>
  );
}
