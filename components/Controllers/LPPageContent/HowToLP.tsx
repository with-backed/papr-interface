import { Fieldset } from 'components/Fieldset';
import { useConfig } from 'hooks/useConfig';
import Link from 'next/link';
import { useMemo } from 'react';

export function HowToLP() {
  const { network, paprTokenAddress, tokenName, underlyingAddress } =
    useConfig();

  const poolURL = useMemo(
    () =>
      `https://app.uniswap.org/#/add/${underlyingAddress}/${paprTokenAddress}/10000?chain=${network}`,
    [network, paprTokenAddress, underlyingAddress],
  );
  return (
    <Fieldset legend="🦄 How to LP">
      <p>
        Liquidity providers earn a 0.3% fee from facilitating swaps in the USDC/
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
