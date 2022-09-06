import { ethers } from 'ethers';
import { SupportedNetwork } from 'lib/config';
import { Quoter } from 'lib/contracts';
import {
  computeSlippageForSwap,
  getQuoteForSwap,
  LendingStrategy,
} from 'lib/strategies';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useConfig } from './useConfig';

export function useQuoteWithSlippage(
  strategy: LendingStrategy,
  amount: string,
  swapForUnderlying: boolean,
) {
  const { network, jsonRpcProvider } = useConfig();
  const [quoteForSwap, setQuoteForSwap] = useState<string>('');
  const [quoteLoading, setQuoteLoading] = useState<boolean>(true);

  const [priceImpact, setPriceImpact] = useState<string>('');
  const [priceImpactLoading, setPriceImpactLoading] = useState<boolean>(true);

  const quoter = Quoter(jsonRpcProvider, network as SupportedNetwork);

  const tokenOut = useMemo(() => {
    if (swapForUnderlying) {
      return strategy.token0IsUnderlying ? strategy.token0 : strategy.token1;
    } else {
      return strategy.token0IsUnderlying ? strategy.token1 : strategy.token0;
    }
  }, [strategy]);
  const tokenIn = useMemo(() => {
    if (swapForUnderlying) {
      return strategy.token0IsUnderlying ? strategy.token1 : strategy.token0;
    } else {
      return strategy.token0IsUnderlying ? strategy.token0 : strategy.token1;
    }
  }, [strategy]);

  const amountToSwap = useMemo(() => {
    if (!amount) return ethers.BigNumber.from(0);
    return ethers.utils.parseUnits(amount, tokenIn.decimals);
  }, [tokenIn, tokenOut, amount]);

  const getQuoteAndPriceImpactForSwap = useCallback(async () => {
    const q = await getQuoteForSwap(quoter, amountToSwap, tokenIn, tokenOut);
    setQuoteForSwap(
      ethers.utils.formatUnits(q, ethers.BigNumber.from(tokenOut.decimals)),
    );
    setQuoteLoading(false);

    const priceImpact = await computeSlippageForSwap(
      q,
      tokenIn,
      tokenOut,
      amountToSwap,
      quoter,
    );
    setPriceImpact(priceImpact.toString());
    setPriceImpactLoading(false);
  }, [amountToSwap, tokenIn, tokenOut, quoter]);

  useEffect(() => {
    if (!amount) return;
    getQuoteAndPriceImpactForSwap();
  }, [amount]);

  return {
    quoteForSwap,
    priceImpact,
    tokenIn,
    tokenOut,
    quoteLoading,
    priceImpactLoading,
  };
}
