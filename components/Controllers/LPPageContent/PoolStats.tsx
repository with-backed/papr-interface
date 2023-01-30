import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { usePoolStats } from 'hooks/usePoolStats';
import dynamic from 'next/dynamic';

import styles from './LPPageContent.module.css';

/* lightweight-charts uses canvas and cannot be SSRed */
const Chart = dynamic(() => import('./Chart').then((mod) => mod.Chart), {
  ssr: false,
});

export function PoolStats() {
  const { fees24h, totalValueLocked, volume24h } = usePoolStats();
  return (
    <Fieldset legend="🛟 Pool Stats">
      <Table>
        <thead>
          <tr>
            <th className={styles.left}>Total Value</th>
            <th className={styles.left}>24H Volume</th>
            <th className={styles.left}>24H Fees</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{totalValueLocked}</td>
            <td>{volume24h}</td>
            <td>{fees24h}</td>
          </tr>
        </tbody>
      </Table>
      <Chart />
    </Fieldset>
  );
}
