import { Pool } from '@uniswap/v3-sdk';
import { Fieldset } from 'components/Fieldset';

type ProvideLiquidityProps = {
  pool: Pool;
};

export default function ProvideLiquidity({ pool }: ProvideLiquidityProps) {
  return (
    <Fieldset legend="🫗 Provide liquidity">
      <a
        href={`https://app.uniswap.org/#/add/${pool?.token0.address}/${pool?.token1.address}/10000?chain=rinkeby`}>
        {' '}
        uniswap{' '}
      </a>
    </Fieldset>
  );
}
