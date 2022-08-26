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

export type StrategyPageProps = {
  address: string;
};

export const getServerSideProps: GetServerSideProps<StrategyPageProps> = async (
  context,
) => {
  const address = context.params?.strategy as string;

  return {
    props: {
      address: address,
    },
  };
};

const PRICE = 20_000;

export default function StrategyPage({ address }: StrategyPageProps) {
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
            <p>
              {lendingStrategy.name} ({lendingStrategy.symbol})
            </p>
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
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  );
}
