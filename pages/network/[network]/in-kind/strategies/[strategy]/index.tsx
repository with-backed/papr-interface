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

type PoolStateProps = {
  pool: Pool;
};

function StrategyState({ strategy }: { strategy: LendingStrategy }) {
  const [strategyIndex, setStrategyIndex] = useState<string>('');
  const [strategyMultiplier, setStrategyMultiplier] = useState<string>('');

  const updateStrategyIndex = useCallback(async () => {
    const index = await strategy.contract.index();
    setStrategyIndex(ethers.utils.formatEther(index));
  }, [strategy]);

  const updateStrategyMultiplier = useCallback(async () => {
    const multiplier = await strategy.contract.targetMultiplier();
    setStrategyMultiplier(ethers.utils.formatEther(multiplier));
  }, [strategy]);

  useEffect(() => {
    updateStrategyIndex();
    updateStrategyMultiplier();
  });

  return (
    <fieldset>
      <legend>Strategy State</legend>
      <p>Index: {strategyIndex}</p>
      <p>Multiplier: {strategyMultiplier}</p>
    </fieldset>
  );
}

function PoolState({ pool }: PoolStateProps) {
  const { chain } = useNetwork();

  return (
    <fieldset>
      <legend>Pool State</legend>
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://app.uniswap.org/#/add/${pool?.token0.address}/${pool?.token1.address}/10000?chain=rinkeby`}>
        {' '}
        see it on app.uniswap.org{' '}
      </a>
      <p>liquidty: {pool?.liquidity.toString()}</p>
      <p>
        {pool?.token0.symbol} price: {pool?.token0Price.toFixed()}
      </p>
      <p>
        {pool?.token1.symbol} price: {pool?.token1Price.toFixed()}
      </p>
    </fieldset>
  );
}

type ProvideLiquidityProps = {
  pool: Pool;
};

function ProvideLiquidity({ pool }: ProvideLiquidityProps) {
  const mint = useCallback(async () => {
    const position = new Position({
      pool: pool,
      liquidity: 1000,
      tickLower:
        nearestUsableTick(pool.tickCurrent, TICK_SPACING) - TICK_SPACING * 2,
      tickUpper:
        nearestUsableTick(pool.tickCurrent, TICK_SPACING) + TICK_SPACING * 2,
    });
    NonfungiblePositionManager.addCallParameters;
  }, [pool]);

  return (
    <fieldset>
      <legend>provide liquidity</legend>
      Go to Uniswap :-)
    </fieldset>
  );
}

type QuoteProps = {
  tokenIn: ERC20Token;
  tokenOut: ERC20Token;
  fee: ethers.BigNumber;
};

function SwapQuote({ tokenIn, tokenOut, fee }: QuoteProps) {
  const [amountIn, setAmountIn] = useState<string>('');
  const [quote, setQuote] = useState<string>('');
  const { jsonRpcProvider, network } = useConfig();
  const getQuote = useCallback(async () => {
    console.log(amountIn);
    const amount = ethers.utils.parseUnits(amountIn, tokenIn.decimals);
    console.log(amount);
    const quoter = Quoter(jsonRpcProvider, network as SupportedNetwork);
    const q: ethers.BigNumber = await quoter.callStatic.quoteExactInputSingle(
      tokenIn.contract.address,
      tokenOut.contract.address,
      fee,
      amount,
      0,
    );
    console.log(`quote ${q} ${tokenOut.symbol}`);
    setQuote(
      ethers.utils.formatUnits(q, ethers.BigNumber.from(tokenOut.decimals)),
    );
  }, [amountIn]);

  return (
    <fieldset>
      <legend>
        {tokenIn.symbol} ➡ {tokenOut.symbol}
      </legend>
      <input
        placeholder={`Enter ${tokenIn.symbol} amount`}
        value={amountIn}
        onChange={(e) => setAmountIn(e.target.value.trim())}></input>
      <button onClick={getQuote}> get quote </button>
      <p>
        {quote} {tokenOut.symbol}
      </p>
    </fieldset>
  );
}
