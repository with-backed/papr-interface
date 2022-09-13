import { Pool } from '@uniswap/v3-sdk';
import { Fieldset } from 'components/Fieldset';
import { useConfig } from 'hooks/useConfig';

type ProvideLiquidityProps = {
  pool: Pool;
};

export default function ProvideLiquidity({ pool }: ProvideLiquidityProps) {
  const { network } = useConfig();
  return (
    <Fieldset legend="🫗 Provide liquidity">
      <a
        href={`https://app.uniswap.org/#/add/${pool?.token0.address}/${pool?.token1.address}/10000?chain=${network}`}>
        {' '}
        uniswap{' '}
      </a>
    </Fieldset>
  );
}
