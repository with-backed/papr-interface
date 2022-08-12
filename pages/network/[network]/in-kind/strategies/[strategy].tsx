import { useConfig } from 'hooks/useConfig';
import { SupportedNetwork } from 'lib/config';
import { makeProvider, Quoter } from 'lib/contracts';
import {
  LendingStrategy,
  populateLendingStrategy,
  Token,
} from 'lib/strategies';
import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Pool } from '@uniswap/v3-sdk';
import { Token as UniswapToken } from '@uniswap/sdk-core';
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { string } from 'yup/lib/locale';
import { ethers } from 'ethers';
import { useAccount, useSigner } from 'wagmi';

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

export default function Strategy({ address }: StrategyPageProps) {
  const config = useConfig();
  const [lendingStrategy, setLendingStrategy] =
    useState<LendingStrategy | null>(null);

  const populate = useCallback(async () => {
    const s = await populateLendingStrategy(address, config);
    setLendingStrategy(s);
  }, [address]);

  useEffect(() => {
    populate();
  });

  return (
    <div>
      <h3>Strategy</h3>
      {lendingStrategy != null ? (
        <div>
          <MintERC20 token={lendingStrategy.underlying} />
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

function MintERC20({ token }: TokenInfoProps) {
  const [balance, setBalance] = useState<string>('');
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const getBalance = useCallback(async () => {
    const b = await token.contract.balanceOf(address!);
    setBalance(ethers.utils.formatUnits(b, token.decimals));
  }, [address]);

  useEffect(() => {
    getBalance();
  });

  return (
    <fieldset>
      <legend>Mint yourself {token.symbol}</legend>
      <p> your balance {balance} </p>
      <input placeholder={'amount'}></input>
      <button>mint</button>
    </fieldset>
  );
}

type TokenInfoProps = {
  token: Token;
};

function TokenInfo({ token }: TokenInfoProps) {
  return (
    <fieldset>
      <p>{token.symbol}</p>
      <p>{token.name}</p>
      <p>{token.decimals}</p>
    </fieldset>
  );
}

type QuoteProps = {
  tokenIn: Token;
  tokenOut: Token;
  fee: ethers.BigNumber;
};

function SwapQuote({ tokenIn, tokenOut, fee }: QuoteProps) {
  const [amountIn, setAmountIn] = useState<string>('');
  const [quote, setQuote] = useState<string>('');
  const { jsonRpcProvider, network } = useConfig();
  const getQuote = useCallback(async () => {
    const amount = ethers.utils.parseUnits(
      amountIn,
      ethers.BigNumber.from(tokenIn.decimals),
    );
    console.log(amount);
    const quoter = Quoter(jsonRpcProvider, network as SupportedNetwork);
    const q: ethers.BigNumber = await quoter.callStatic.quoteExactInputSingle(
      tokenIn.contract.address,
      tokenOut.contract.address,
      fee, // 1% fee tier
      amount,
      0,
    );
    console.log(`quote ${q}`);
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
      <p>{quote}</p>
    </fieldset>
  );
}
