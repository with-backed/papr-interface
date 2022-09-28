import { Pool } from '@uniswap/v3-sdk';
import { Fieldset } from 'components/Fieldset';
import { useConfig } from 'hooks/useConfig';

type PoolStateProps = {
  pool: Pool | null;
};

export default function PoolState({ pool }: PoolStateProps) {
  const { network } = useConfig();
  return (
    <Fieldset legend="🏊 Pool State">
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://app.uniswap.org/#/add/${pool?.token0.address}/${pool?.token1.address}/10000?chain=${network}`}>
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
    </Fieldset>
  );
}
