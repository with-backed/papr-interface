import controllerStyles from 'components/Controllers/Controller.module.css';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { useConfig } from 'hooks/useConfig';
import { usePoolChartData } from 'hooks/usePoolChartData';
import { usePoolStats } from 'hooks/usePoolStats';
import Link from 'next/link';
import { useMemo } from 'react';
import styles from './LPPageContent.module.css';

export function LPPageContent() {
  const { tokenName, underlyingAddress, paprTokenAddress, network } =
    useConfig();
  const poolURL = useMemo(
    () =>
      `https://app.uniswap.org/#/add/${underlyingAddress}/${paprTokenAddress}/10000?chain=${network}`,
    [network, paprTokenAddress, underlyingAddress],
  );

  const { fees24h, totalValueLocked, volume24h } = usePoolStats();
  const { chartData, allFound } = usePoolChartData();

  console.log({ chartData, allFound });

  return (
    <div className={controllerStyles.wrapper}>
      <Fieldset legend="🦄 How to LP">
        <p>
          Liquidity providers earn a 0.3% fee from facilitating swaps in the
          USDC/{tokenName} pool on Uniswap. Here&apos;s how to join:
        </p>
        <ol>
          <li>You&apos;ll need either USDC, {tokenName} or both</li>
          <li>
            Visit the{' '}
            <Link href={poolURL} target="_blank">
              pool on Uniswap
            </Link>{' '}
            and select &ldquo;Add Liquidity&rdquo;
          </li>
        </ol>
      </Fieldset>
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
      </Fieldset>
    </div>
  );
}
