import { Fieldset } from 'components/Fieldset';
import { useConfig } from 'hooks/useConfig';
import { usePoolStats } from 'hooks/usePoolStats';
import {
  POOL_STATS_LOADING,
  POOL_STATS_NO_DATA,
} from 'hooks/usePoolStats/usePoolStats';
import Link from 'next/link';
import { useMemo } from 'react';

export function HowToLP() {
  const { network, paprTokenAddress, tokenName, underlyingAddress } =
    useConfig();
  const { feeTier } = usePoolStats();

  const poolURL = useMemo(
    () =>
      `https://app.uniswap.org/#/add/${underlyingAddress}/${paprTokenAddress}/10000?chain=${network}`,
    [network, paprTokenAddress, underlyingAddress],
  );
  const formattedFeeTier = useMemo(() => {
    if (feeTier === POOL_STATS_LOADING || feeTier === POOL_STATS_NO_DATA) {
      return '...';
    }
    return feeTier;
  }, [feeTier]);
  return (
    <Fieldset legend="🦄 How to LP">
      <p>
        Liquidity providers earn a {formattedFeeTier} fee from facilitating
        swaps in the USDC/
        {tokenName} pool on Uniswap. Here&apos;s how to join:
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
  );
}
