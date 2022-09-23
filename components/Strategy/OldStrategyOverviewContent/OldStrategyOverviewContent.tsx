import React, { useCallback, useEffect, useState } from 'react';
import styles from 'components/Strategy/Strategy.module.css';
import { LendingStrategyByIdQuery } from 'types/generated/graphql/inKindSubgraph';
import { StrategyPricesData } from 'lib/strategies/charts';
import { useConfig } from 'hooks/useConfig';
import { populateLendingStrategy } from 'lib/strategies';
import StrategyState from './StrategyState';
import PoolState from './PoolState';
import ProvideLiquidity from './ProvideLiquidty';
import SwapQuote from './SwapQuote';
import SwapTokens from './SwapTokens';

export type OldStrategyPageProps = {
  address: string;
  subgraphLendingStrategy: LendingStrategyByIdQuery['lendingStrategy'] | null;
  pricesData: StrategyPricesData | null;
};

// TODO: make this real
const PRICE = 20_000;

export function OldStrategyOverviewContent({
  address,
  subgraphLendingStrategy,
  pricesData,
}: OldStrategyPageProps) {
  const config = useConfig();
  const [lendingStrategy, setLendingStrategy] = useState<any | null>(null);

  const populate = useCallback(async () => {
    const s = await populateLendingStrategy(address, config);
    setLendingStrategy(s);
  }, [address, config]);

  useEffect(() => {
    populate();
  }, [populate]);

  return (
    <div>
      {!!lendingStrategy && !!pricesData && (
        <div className={styles.wrapper}>
          <div>
            <h3>Strategy</h3>
            <p>(fake) oracle price: {PRICE} </p>
          </div>
          <StrategyState strategy={lendingStrategy} pricesData={pricesData} />
          <PoolState pool={lendingStrategy.pool} />
          <ProvideLiquidity pool={lendingStrategy.pool} />
          <SwapQuote strategy={lendingStrategy} swapForUnderlying />
          <SwapQuote strategy={lendingStrategy} swapForUnderlying={false} />
          <SwapTokens
            tokenOne={lendingStrategy!.token0}
            tokenTwo={lendingStrategy!.token1}
          />
        </div>
      )}
    </div>
  );
}
