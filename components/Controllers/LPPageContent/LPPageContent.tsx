import styles from 'components/Controllers/Controller.module.css';
import { Fieldset } from 'components/Fieldset';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { formatDollars } from 'lib/numberFormat';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  PoolByIdDocument,
  PoolByIdQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { useQuery } from 'urql';

export function LPPageContent() {
  const {
    tokenName,
    underlyingAddress,
    paprTokenAddress,
    network,
    uniswapSubgraph,
  } = useConfig();
  const { poolAddress } = useController();
  const poolURL = useMemo(
    () =>
      `https://app.uniswap.org/#/add/${underlyingAddress}/${paprTokenAddress}/10000?chain=${network}`,
    [network, paprTokenAddress, underlyingAddress],
  );

  const [{ data, fetching, error }] = useQuery<PoolByIdQuery>({
    query: PoolByIdDocument,
    variables: { id: poolAddress },
    context: useMemo(
      () => ({
        url: uniswapSubgraph,
      }),
      [uniswapSubgraph],
    ),
  });

  const volume24h = useMemo(() => {
    if (fetching) {
      return 'Loading...';
    }
    if (error || !data?.pool) {
      return '---';
    }

    return formatDollars(data.pool.volumeUSD);
  }, [data, error, fetching]);

  const totalValueLocked = useMemo(() => {
    if (fetching) {
      return 'Loading...';
    }
    if (error || !data?.pool) {
      return '---';
    }

    return formatDollars(data.pool.totalValueLockedUSD);
  }, [data, error, fetching]);

  const fees24h = useMemo(() => {
    if (fetching) {
      return 'Loading...';
    }
    if (error || !data?.pool) {
      return '---';
    }
    const { feeTier, volumeUSD } = data.pool;
    const volumeNum = parseFloat(volumeUSD);
    const feeTierNum = parseInt(feeTier);
    return formatDollars(volumeNum * (feeTierNum / 1000000));
  }, [data, error, fetching]);

  return (
    <div className={styles.wrapper}>
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
        <div>Volume 24h: {volume24h}</div>
        <div>Total Value: {totalValueLocked}</div>
        <div>Fees 24h: {fees24h}</div>
      </Fieldset>
    </div>
  );
}
