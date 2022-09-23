import { ethers } from 'ethers';
import { SupportedNetwork } from 'lib/config';
import { Quoter } from 'lib/contracts';
import { computeSlippageForSwap, getQuoteForSwap } from 'lib/strategies';
import { LendingStrategy } from 'lib/LendingStrategy';
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

  const amountToSwap = useMemo(() => {
    if (!parseInt(amount)) return ethers.BigNumber.from(0);
    return ethers.utils.parseUnits(amount, tokenIn.decimals);
  }, [tokenIn, amount]);

  const getQuoteAndPriceImpactForSwap = useCallback(async () => {
    let q: ethers.BigNumber;
    try {
      q = await getQuoteForSwap(quoter, amountToSwap, tokenIn.id, tokenOut.id);
      setQuoteForSwap(
        parseFloat(
          ethers.utils.formatUnits(q, ethers.BigNumber.from(tokenOut.decimals)),
        ).toFixed(4),
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
      amountToSwap,
      quoter,
    );
    setPriceImpact(priceImpact.toFixed(4));
    setPriceImpactLoading(false);
  }, [amountToSwap, tokenIn, tokenOut, quoter]);

  useEffect(() => {
    if (!parseInt(amount)) return;
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
