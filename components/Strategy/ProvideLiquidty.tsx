import { Pool } from '@uniswap/v3-sdk';

type ProvideLiquidityProps = {
  pool: Pool;
};

export default function ProvideLiquidity({ pool }: ProvideLiquidityProps) {
  return (
    <fieldset>
      <legend>provide liquidity</legend>
      <a
        href={`https://app.uniswap.org/#/add/${pool?.token0.address}/${pool?.token1.address}/10000?chain=rinkeby`}>
        {' '}
        uniswap{' '}
      </a>
    </fieldset>
  );
}
