import React, { useCallback, useEffect, useState } from 'react';
import styles from 'components/Strategy/Strategy.module.css';
import { LendingStrategyByIdQuery } from 'types/generated/graphql/inKindSubgraph';
import { StrategyPricesData } from 'lib/strategies/charts';
import { useConfig } from 'hooks/useConfig';
import { LendingStrategy, populateLendingStrategy } from 'lib/strategies';
import StrategyState from '../StrategyState';
import PoolState from '../PoolState';
import MintERC20 from '../MintERC20';
import MintCollateral from '../MintCollateral';
import ProvideLiquidity from '../ProvideLiquidty';
import SwapQuote from '../SwapQuote';
import SwapTokens from '../SwapTokens';
import { AssociatedVaults } from '../AssociatedVaults';
import { StrategyCharts } from 'components/StrategyCharts';

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
  const [lendingStrategy, setLendingStrategy] =
    useState<LendingStrategy | null>(null);

  const populate = useCallback(async () => {
    const s = await populateLendingStrategy(address, config);
    setLendingStrategy(s);
  }, [address, config]);

  useEffect(() => {
    populate();
  }, [populate]);

  return (
    <div>
      <h3>Strategy</h3>
      <p>(fake) oracle price: {PRICE} </p>
      {!!lendingStrategy && !!pricesData && (
        <div className={styles.wrapper}>
          <div className={styles.column}>
            <StrategyState strategy={lendingStrategy} pricesData={pricesData} />
            <PoolState pool={lendingStrategy.pool} />
            <MintERC20 token={lendingStrategy.underlying} />
            <MintCollateral token={lendingStrategy.collateral} />
            <ProvideLiquidity pool={lendingStrategy.pool} />
            <SwapQuote strategy={lendingStrategy} swapForUnderlying />
            <SwapQuote strategy={lendingStrategy} swapForUnderlying={false} />
            <SwapTokens
              tokenOne={lendingStrategy!.token0}
              tokenTwo={lendingStrategy!.token1}
            />
          </div>
          <div className={styles.column}>
            <AssociatedVaults strategy={address} />
            <StrategyCharts pricesData={pricesData} />
          </div>
        </div>
      )}
    </div>
  );
}
