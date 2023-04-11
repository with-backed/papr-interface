import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { SupportedToken } from 'lib/config';
import {
  computeSlippageForSwap,
  emptyQuoteResult,
  ERC20Token,
  QuoterResult,
} from 'lib/controllers';
import { getQuoteForSwap, getQuoteForSwapOutput } from 'lib/controllers';
import { useEffect, useState } from 'react';

export type QuoteWithSlippage = QuoterResult & { slippage: number | null };
const emptyQuoteWithSlippage: QuoteWithSlippage = {
  ...emptyQuoteResult,
  slippage: null,
};

type UsePoolQuoteParams = {
  amount: ethers.BigNumber | undefined;
  inputToken: ERC20Token;
  outputToken: ERC20Token;
  tradeType: 'exactIn' | 'exactOut';
  withSlippage?: boolean;
  skip?: boolean;
};

export function usePoolQuote({
  amount,
  inputToken,
  outputToken,
  tradeType,
  withSlippage,
  skip,
}: UsePoolQuoteParams) {
  const { tokenName } = useConfig();
  const [quoteResult, setQuoteResult] = useState<QuoteWithSlippage>(
    emptyQuoteWithSlippage,
  );

  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount) return emptyQuoteWithSlippage;

      const quoteWithSlippage: QuoteWithSlippage = {
        ...emptyQuoteWithSlippage,
      };
      let quoterResult: QuoterResult;

      if (tradeType === 'exactIn') {
        quoterResult = await getQuoteForSwap(
          amount,
          inputToken.id,
          outputToken.id,
          tokenName as SupportedToken,
        );
      } else {
        quoterResult = await getQuoteForSwapOutput(
          amount,
          inputToken.id,
          outputToken.id,
          tokenName as SupportedToken,
        );
      }
      if (!quoterResult.quote) return quoteWithSlippage;

      quoteWithSlippage.quote = quoterResult.quote;
      quoteWithSlippage.sqrtPriceX96After = quoterResult.sqrtPriceX96After;
      if (withSlippage)
        quoteWithSlippage.slippage = await computeSlippageForSwap(
          quoterResult.quote,
          inputToken,
          outputToken,
          amount,
          tradeType,
          tokenName as SupportedToken,
        );
      return quoteWithSlippage;
    };
    if (!skip) fetchQuote().then((quote) => setQuoteResult(quote));
  }, [
    amount,
    inputToken,
    outputToken,
    tradeType,
    tokenName,
    withSlippage,
    skip,
  ]);

  return quoteResult;
}
