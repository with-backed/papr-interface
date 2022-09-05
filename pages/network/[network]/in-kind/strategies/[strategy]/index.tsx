import { useConfig } from 'hooks/useConfig';
import { LendingStrategy, populateLendingStrategy } from 'lib/strategies';
import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import MintERC20 from 'components/Strategy/MintERC20';
import MintCollateral from 'components/Strategy/MintCollateral';
import OpenVault from 'components/Strategy/OpenVault';
import PoolState from 'components/Strategy/PoolState';
import SwapQuote from 'components/Strategy/SwapQuote';
import StrategyState from 'components/Strategy/StrategyState';
import ProvideLiquidity from 'components/Strategy/ProvideLiquidty';
import SwapTokens from 'components/Strategy/SwapTokens';
import styles from './strategy.module.css';
import { AssociatedVaults } from 'components/Strategy/AssociatedVaults';
import { D3Demo } from 'components/Strategy/D3Demo';
import { LendingStrategyByIdQuery } from 'types/generated/graphql/inKindSubgraph';
import {
  PoolByIdQuery,
  SqrtPricesByPoolQuery,
  SwapsByPoolQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { subgraphStrategyByAddress } from 'lib/pAPRSubgraph';
import {
  subgraphUniswapPoolById,
  subgraphUniswapPriceByPool,
  subgraphUniswapSwapsByPool,
} from 'lib/uniswapSubgraph';

export type StrategyPageProps = {
  address: string;
  lendingStrategy: LendingStrategyByIdQuery['lendingStrategy'] | null;
  poolSwapData: SwapsByPoolQuery['swaps'] | null;
  pool: PoolByIdQuery['pool'] | null;
};

export const getServerSideProps: GetServerSideProps<StrategyPageProps> = async (
  context,
) => {
  const address = (context.params?.strategy as string).toLowerCase();

  const subgraphStrategy = await subgraphStrategyByAddress(address);

  const [subgraphUniswapPrices, subgraphUniswapPool] = await Promise.all([
    subgraphUniswapSwapsByPool(subgraphStrategy?.lendingStrategy?.poolAddress),
    subgraphUniswapPoolById(subgraphStrategy?.lendingStrategy?.poolAddress),
  ]);

  return {
    props: {
      address: address,
      lendingStrategy: subgraphStrategy?.lendingStrategy || null,
      poolSwapData: subgraphUniswapPrices?.swaps || null,
      pool: subgraphUniswapPool?.pool || null,
    },
  };
};

const PRICE = 20_000;

export default function StrategyPage({
  address,
  lendingStrategy: subgraphLendingStrategy,
  poolSwapData,
  pool,
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
      {lendingStrategy != null ? (
        <div className={styles.wrapper}>
          <div className={styles.column}>
            <StrategyState strategy={lendingStrategy} />
            <PoolState pool={lendingStrategy.pool} />
            <MintERC20 token={lendingStrategy.underlying} />
            <MintCollateral token={lendingStrategy.collateral} />
            <ProvideLiquidity pool={lendingStrategy.pool} />
            <OpenVault strategy={lendingStrategy} />
            <SwapQuote
              strategy={lendingStrategy}
              tokenIn={lendingStrategy!.token0}
              tokenOut={lendingStrategy!.token1}
              fee={ethers.BigNumber.from(10).pow(4)} // 1% fee tier, should just fetch from pool directly
            />
            <SwapQuote
              strategy={lendingStrategy}
              tokenIn={lendingStrategy!.token1}
              tokenOut={lendingStrategy!.token0}
              fee={ethers.BigNumber.from(10).pow(4)} // 1% fee tier, should just fetch from pool directly
            />
            <SwapTokens
              tokenOne={lendingStrategy!.token0}
              tokenTwo={lendingStrategy!.token1}
            />
          </div>
          <div className={styles.column}>
            <AssociatedVaults strategy={address} />
            <D3Demo
              strategy={address}
              targetAnnualGrowth={lendingStrategy.targetAnnualGrowth}
              targetGrowthPerPeriod={lendingStrategy.targetGrowthPerPeriod}
              lendingStrategy={subgraphLendingStrategy}
              poolSwapData={poolSwapData}
              pool={pool}
            />
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  );
}
