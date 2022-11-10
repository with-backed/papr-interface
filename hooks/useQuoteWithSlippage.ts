import { ethers } from 'ethers';
import { SupportedToken } from 'lib/config';
import { Quoter } from 'lib/contracts';
import { computeSlippageForSwap, getQuoteForSwap } from 'lib/strategies';
import { LendingStrategy } from 'lib/LendingStrategy';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useConfig } from './useConfig';

export function useQuoteWithSlippage(
  strategy: LendingStrategy,
  amount: ethers.BigNumber,
  swapForUnderlying: boolean,
) {
  const { tokenName, jsonRpcProvider } = useConfig();
  const [quoteForSwap, setQuoteForSwap] = useState<string>('');
  const [quoteLoading, setQuoteLoading] = useState<boolean>(true);

  const [priceImpact, setPriceImpact] = useState<string>('');
  const [priceImpactLoading, setPriceImpactLoading] = useState<boolean>(true);

  const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);

  const tokenOut = useMemo(() => {
    if (swapForUnderlying) {
      return strategy.token0IsUnderlying
        ? strategy.subgraphPool.token0
        : strategy.subgraphPool.token1;
    } else {
      return strategy.token0IsUnderlying
        ? strategy.subgraphPool.token1
        : strategy.subgraphPool.token0;
    }
  }, [strategy, swapForUnderlying]);
  const tokenIn = useMemo(() => {
    if (swapForUnderlying) {
      return strategy.token0IsUnderlying
        ? strategy.subgraphPool.token1
        : strategy.subgraphPool.token0;
    } else {
      return strategy.token0IsUnderlying
        ? strategy.subgraphPool.token0
        : strategy.subgraphPool.token1;
    }
  }, [strategy, swapForUnderlying]);

  const getQuoteAndPriceImpactForSwap = useCallback(async () => {
    let q: ethers.BigNumber;
    try {
      q = await getQuoteForSwap(quoter, amount, tokenIn.id, tokenOut.id);
      setQuoteForSwap(
        ethers.utils.formatUnits(q, ethers.BigNumber.from(tokenOut.decimals)),
      );
      setQuoteLoading(false);
    } catch (e) {
      console.error(e);
      setQuoteLoading(false);
      setPriceImpactLoading(false);
      return;
    }

    const priceImpact = await computeSlippageForSwap(
      q,
      tokenIn,
      tokenOut,
      amount,
      quoter,
    );
    setPriceImpact(priceImpact.toFixed(4));
    setPriceImpactLoading(false);
  }, [tokenIn, tokenOut, quoter, amount]);

  useEffect(() => {
    if (amount.isZero()) return;
    getQuoteAndPriceImpactForSwap();
  }, [amount, getQuoteAndPriceImpactForSwap]);

  return {
    quoteForSwap,
    priceImpact,
    tokenIn,
    tokenOut,
    quoteLoading,
    priceImpactLoading,
  };
}
