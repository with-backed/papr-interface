import { ethers } from 'ethers';
import { SupportedToken } from 'lib/config';
import { Quoter } from 'lib/contracts';
import { computeSlippageForSwap, getQuoteForSwap } from 'lib/controllers';
import { PaprController } from 'lib/PaprController';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useConfig } from './useConfig';

export function useQuoteWithSlippage(
  controller: PaprController,
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
      return controller.token0IsUnderlying
        ? controller.subgraphPool.token0
        : controller.subgraphPool.token1;
    } else {
      return controller.token0IsUnderlying
        ? controller.subgraphPool.token1
        : controller.subgraphPool.token0;
    }
  }, [controller, swapForUnderlying]);
  const tokenIn = useMemo(() => {
    if (swapForUnderlying) {
      return controller.token0IsUnderlying
        ? controller.subgraphPool.token1
        : controller.subgraphPool.token0;
    } else {
      return controller.token0IsUnderlying
        ? controller.subgraphPool.token0
        : controller.subgraphPool.token1;
    }
  }, [controller, swapForUnderlying]);

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
