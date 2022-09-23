import React from 'react';
import styles from 'components/Strategy/Strategy.module.css';
import { StrategyPricesData } from 'lib/strategies/charts';
import StrategyState from './StrategyState';
import PoolState from './PoolState';
import ProvideLiquidity from './ProvideLiquidty';
import SwapQuote from './SwapQuote';
import SwapTokens from './SwapTokens';
import { LendingStrategy } from 'lib/LendingStrategy';
import { useAsyncValue } from 'hooks/useAsyncValue';

export type OldStrategyPageProps = {
  address: string;
  lendingStrategy: LendingStrategy;
  pricesData: StrategyPricesData | null;
};

// TODO: make this real
const PRICE = 20_000;

export function OldStrategyOverviewContent({
  address,
  lendingStrategy,
  pricesData,
}: OldStrategyPageProps) {
  const pool = useAsyncValue(() => lendingStrategy.pool(), [lendingStrategy]);
  return (
    <div>
      {!!lendingStrategy && !!pricesData && (
        <div className={styles.wrapper}>
          <div>
            <h3>Strategy</h3>
            <p>(fake) oracle price: {PRICE} </p>
          </div>
          <StrategyState strategy={lendingStrategy} pricesData={pricesData} />
          <PoolState pool={pool} />
          <ProvideLiquidity pool={pool} />
          <SwapQuote strategy={lendingStrategy} swapForUnderlying />
          <SwapQuote strategy={lendingStrategy} swapForUnderlying={false} />
          <SwapTokens
            tokenOne={lendingStrategy.subgraphPool.token0}
            tokenTwo={lendingStrategy.subgraphPool.token1}
          />
        </div>
      )}
    </div>
  );
}
