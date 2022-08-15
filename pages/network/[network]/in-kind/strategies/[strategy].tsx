import { useConfig } from 'hooks/useConfig';
import { SupportedNetwork } from 'lib/config';
import { makeProvider, Quoter } from 'lib/contracts';
import {
  LendingStrategy,
  populateLendingStrategy,
  ERC20Token,
  ERC721Token,
} from 'lib/strategies';
import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  nearestUsableTick,
  NonfungiblePositionManager,
  Pool,
  Position,
} from '@uniswap/v3-sdk';
import { CurrencyAmount, Token as UniswapToken } from '@uniswap/sdk-core';
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { string } from 'yup/lib/locale';
import { ethers } from 'ethers';
import { useAccount, useNetwork, useSigner } from 'wagmi';
import { getPool, getPoolState } from 'lib/strategies/uniswap';
import { SESSION_TRANSPORT_CATEGORY } from '@sentry/core/types/transports/base';
import {
  MockCollateral__factory,
  MockDAI__factory,
} from 'types/generated/abis';
import { MockUnderlying__factory } from 'types/generated/abis/factories/MockUnderlying__factory';

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

export default function Strategy({ address }: StrategyPageProps) {
  const { chain } = useNetwork();
  const config = useConfig();
  const [lendingStrategy, setLendingStrategy] =
    useState<LendingStrategy | null>(null);

  const populate = useCallback(async () => {
    const s = await populateLendingStrategy(address, config, chain!);
    setLendingStrategy(s);
    // const p : Pool = await getPool(
    //     s.pool,
    //     s.token0,
    //     s.token1,
    //     chain!
    // )
    // console.log(p.priceOf(p.token0))
    // console.log(p.token0Price.toFixed())
    // console.log(p.token1Price.toFixed())

    // // const c = CurrencyAmount.fromRawAmount(p.token0, '1000')
    // // console.log(p.getInputAmount(c))
    // const state = await getPoolState(s.pool)
    // const position = new Position({
    //     pool: p,
    //     liquidity: p.liquidity,
    //     tickLower: nearestUsableTick(state.tick, 200) - 200 * 2,
    //     tickUpper: nearestUsableTick(state.tick, 200) + 200 * 2,
    //   })
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
          <p>
            {lendingStrategy.name} ({lendingStrategy.symbol})
          </p>
          <PoolState pool={lendingStrategy.pool} />
          <MintERC20 token={lendingStrategy.underlying} />
          <MintCollateral token={lendingStrategy.collateral} />
          <ProvideLiquidity pool={lendingStrategy.pool} />
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

type TokenInfoProps = {
  token: ERC20Token;
};

function MintERC20({ token }: TokenInfoProps) {
  const [balance, setBalance] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const getBalance = useCallback(async () => {
    const b = await token.contract.balanceOf(address!);
    setBalance(ethers.utils.formatUnits(b, token.decimals));
  }, [address]);

  const mint = useCallback(async () => {
    if (signer == null || address == null) {
      console.log('address or sigenr null');
      return;
    }
    const contract = MockUnderlying__factory.connect(
      token.contract.address,
      signer,
    );
    console.log(value);
    console.log(token.decimals);
    ethers.utils.parseUnits(value, token.decimals);
    const t = await contract.mint(
      address,
      ethers.utils.parseUnits(value, token.decimals),
    );
    t.wait();
    getBalance();
  }, [address, signer, value]);

  useEffect(() => {
    getBalance();
  });

  return (
    <fieldset>
      <legend>Mint yourself {token.symbol}</legend>
      <p> your balance: {balance} </p>
      <input
        placeholder={'amount'}
        onChange={(e) => setValue(e.target.value)}></input>
      <button onClick={mint}>mint</button>
    </fieldset>
  );
}

type MintCollateralProps = {
  token: ERC721Token;
};

function MintCollateral({ token }: MintCollateralProps) {
  const [balance, setBalance] = useState<string>('');
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const getBalance = useCallback(async () => {
    const b = await token.contract.balanceOf(address!);
    setBalance(b.toString());
  }, [address]);

  const mint = useCallback(async () => {
    if (signer == null || address == null) {
      console.log('address or sigenr null');
      return;
    }
    const contract = MockCollateral__factory.connect(
      token.contract.address,
      signer,
    );
    const t = await contract.mint(address);
    t.wait();
    getBalance();
  }, [address, signer]);

  useEffect(() => {
    getBalance();
  });

  return (
    <fieldset>
      <legend>Mint yourself {token.symbol}</legend>
      <p> your balance: {balance} </p>
      <button onClick={mint}>mint</button>
    </fieldset>
  );
}

function TokenInfo({ token }: TokenInfoProps) {
  return (
    <fieldset>
      <p>{token.symbol}</p>
      <p>{token.name}</p>
      <p>{token.decimals}</p>
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
  }, []);

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
