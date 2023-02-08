import { Fieldset } from 'components/Fieldset';
import { useConfig } from 'hooks/useConfig';
import { usePoolStats } from 'hooks/usePoolStats';
import Link from 'next/link';
import { useMemo } from 'react';

export function HowToLP() {
  const { network, paprTokenAddress, tokenName, underlyingAddress } =
    useConfig();
  const { feeTier, fetching } = usePoolStats();

  const poolURL = useMemo(
    () =>
      `https://app.uniswap.org/#/add/${
        underlyingAddress.toLowerCase() ==
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
          ? 'ETH'
          : underlyingAddress
      }/${paprTokenAddress}/10000?chain=${network}`,
    // if underlying is WETH then send to ETH interface, is same pool but easier
    [network, paprTokenAddress, underlyingAddress],
  );
  const formattedFeeTier = useMemo(() => {
    if (fetching) {
      return '...';
    }
    return feeTier;
  }, [feeTier, fetching]);
  return (
    <Fieldset legend="🦄 How to LP">
      <p>
        Liquidity providers earn a {formattedFeeTier} fee from facilitating
        swaps in the WETH/
        {tokenName} pool on Uniswap. Here&apos;s how to join:
      </p>
      <ol>
        <li>You&apos;ll need either WETH, {tokenName} or both</li>
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
