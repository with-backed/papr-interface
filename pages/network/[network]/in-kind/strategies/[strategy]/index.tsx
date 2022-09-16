import { useConfig } from 'hooks/useConfig';
import { LendingStrategy, populateLendingStrategy } from 'lib/strategies';
import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useState } from 'react';
import MintERC20 from 'components/Strategy/MintERC20';
import MintCollateral from 'components/Strategy/MintCollateral';
import PoolState from 'components/Strategy/PoolState';
import SwapQuote from 'components/Strategy/SwapQuote';
import StrategyState from 'components/Strategy/StrategyState';
import ProvideLiquidity from 'components/Strategy/ProvideLiquidty';
import SwapTokens from 'components/Strategy/SwapTokens';
import styles from './strategy.module.css';
import { AssociatedVaults } from 'components/Strategy/AssociatedVaults';
import { Chart } from 'components/Chart';
import {
  LendingStrategyByIdQuery,
  LendingStrategy as SubgraphLendingStrategy,
} from 'types/generated/graphql/inKindSubgraph';
import { subgraphStrategyByAddress } from 'lib/pAPRSubgraph';
import { StrategyPricesData, strategyPricesData } from 'lib/strategies/charts';
import { SupportedNetwork } from 'lib/config';
import { Fieldset } from 'components/Fieldset';
import { StrategyCharts } from 'components/StrategyCharts';

export type StrategyPageProps = {
  address: string;
  lendingStrategy: LendingStrategyByIdQuery['lendingStrategy'] | null;
  pricesData: StrategyPricesData | null;
};

export const getServerSideProps: GetServerSideProps<StrategyPageProps> = async (
  context,
) => {
  const address = (context.params?.strategy as string).toLowerCase();
  const network = context.params?.network as SupportedNetwork;

  const subgraphStrategy = await subgraphStrategyByAddress(address);

  var pricesData: StrategyPricesData | null = null;
  if (subgraphStrategy?.lendingStrategy) {
    pricesData = await strategyPricesData(
      subgraphStrategy.lendingStrategy as SubgraphLendingStrategy,
      network,
    );
  }

  return {
    props: {
      address: address,
      lendingStrategy: subgraphStrategy?.lendingStrategy || null,
      pricesData: pricesData,
    },
  };
};

const PRICE = 20_000;

export default function StrategyPage({
  address,
  lendingStrategy: subgraphLendingStrategy,
  pricesData,
}: StrategyPageProps) {
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
      {lendingStrategy != null && pricesData != null ? (
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
      ) : (
        ''
      )}
    </div>
  );
}
