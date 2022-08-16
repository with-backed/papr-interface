import { Pool } from '@uniswap/v3-sdk';
import { useNetwork } from 'wagmi';

type PoolStateProps = {
  pool: Pool;
};

export default function PoolState({ pool }: PoolStateProps) {
  const { chain } = useNetwork();

  return (
    <fieldset>
      <legend>Pool State</legend>
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://app.uniswap.org/#/add/${pool?.token0.address}/${pool?.token1.address}/10000?chain=rinkeby`}>
        {' '}
        see it on app.uniswap.org{' '}
      </a>
      <p>liquidty: {pool?.liquidity.toString()}</p>
      <p>
        {pool?.token0.symbol} price: {pool?.token0Price.toFixed()}
      </p>
      <p>
        {pool?.token1.symbol} price: {pool?.token1Price.toFixed()}
      </p>
    </fieldset>
  );
}
