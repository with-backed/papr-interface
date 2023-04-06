import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { SupportedToken } from 'lib/config';
import { emptyQuoteResult, QuoterResult } from 'lib/controllers';
import { getQuoteForSwap, getQuoteForSwapOutput } from 'lib/controllers';
import { useEffect, useState } from 'react';

export type QuoteWithSlippage = QuoterResult & { slippage: number };

export function usePoolQuote(
  amount: ethers.BigNumber | undefined,
  inputToken: string,
  outputToken: string,
  tradeType: 'exactIn' | 'exactOut',
  skip = false,
) {
  const { tokenName } = useConfig();
  const [quoteResult, setQuoteResult] =
    useState<QuoterResult>(emptyQuoteResult);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount) return emptyQuoteResult;
      if (tradeType === 'exactIn') {
        return getQuoteForSwap(
          amount,
          inputToken,
          outputToken,
          tokenName as SupportedToken,
        );
      } else {
        return getQuoteForSwapOutput(
          amount,
          inputToken,
          outputToken,
          tokenName as SupportedToken,
        );
      }
    };
    if (!skip) fetchQuote().then((quote) => setQuoteResult(quote));
  }, [amount, inputToken, outputToken, tradeType, tokenName, skip]);

  return quoteResult;
}
