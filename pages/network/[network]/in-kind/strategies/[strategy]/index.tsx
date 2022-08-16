import { useConfig } from 'hooks/useConfig';
import { SupportedNetwork } from 'lib/config';
import { Quoter } from 'lib/contracts';
import {
  LendingStrategy,
  populateLendingStrategy,
  ERC20Token,
} from 'lib/strategies';
import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  nearestUsableTick,
  NonfungiblePositionManager,
  Pool,
  Position,
} from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import { useNetwork } from 'wagmi';
import MintERC20 from 'components/Strategy/MintERC20';
import MintCollateral from 'components/Strategy/MintCollateral';
import OpenVault from 'components/Strategy/OpenVault';
import PoolState from 'components/Strategy/PoolState';
import SwapQuote from 'components/Strategy/SwapQuote';
import StrategyState from 'components/Strategy/StrategyState';
import ProvideLiquidity from 'components/Strategy/ProvideLiquidty';

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

const TICK_SPACING = 200;
const PRICE = 20_000;

export default function StrategyPage({ address }: StrategyPageProps) {
  const { chain } = useNetwork();
  const config = useConfig();
  const [lendingStrategy, setLendingStrategy] =
    useState<LendingStrategy | null>(null);

  const populate = useCallback(async () => {
    const s = await populateLendingStrategy(address, config, chain!);
    setLendingStrategy(s);
  }, [address]);

  useEffect(() => {
    populate();
  }, [address]);

  return (
    <div>
      <h3>Strategy</h3>
      <p>(fake) oracle price: {PRICE} </p>
      {lendingStrategy != null ? (
        <div>
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
            tokenIn={lendingStrategy!.token0}
            tokenOut={lendingStrategy!.token1}
            fee={ethers.BigNumber.from(10).pow(4)} // 1% fee tier, should just fetch from pool directly
          />
          <SwapQuote
            tokenIn={lendingStrategy!.token1}
            tokenOut={lendingStrategy!.token0}
            fee={ethers.BigNumber.from(10).pow(4)} // 1% fee tier, should just fetch from pool directly
          />
        </div>
      ) : (
        ''
      )}
    </div>
  );
}
