import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import { SupportedNetwork } from 'lib/config';
import { Quoter } from 'lib/contracts';
import {
  computeEffectiveAPR,
  computeSlippageForSwap,
  ERC20Token,
  getQuoteForSwap,
  LendingStrategy,
  multiplier,
} from 'lib/strategies';
import { useCallback, useState } from 'react';

type QuoteProps = {
  strategy: LendingStrategy;
  swapForUnderlying: boolean;
};

export default function SwapQuote({ strategy, swapForUnderlying }: QuoteProps) {
  const [amountIn, setAmountIn] = useState<string>('');
  const { quoteForSwap, priceImpact, tokenIn, tokenOut } = useQuoteWithSlippage(
    strategy,
    amountIn,
    swapForUnderlying,
  );
  const [internalAPRAfter, setInternalAPRAfter] =
    useState<string>('coming soon');
  const { jsonRpcProvider, network } = useConfig();

  return (
    <Fieldset legend={`💱 ${tokenIn.symbol} ➡ ${tokenOut.symbol}`}>
      <input
        placeholder={`Enter ${tokenIn.symbol} amount`}
        value={amountIn}
        onChange={(e) => setAmountIn(e.target.value.trim())}></input>
      <p>
        {quoteForSwap} {tokenOut.symbol} <br />
        {!!quoteForSwap && <span>price impact: {priceImpact}%</span>}
      </p>
      {!!quoteForSwap && (
        <p>
          Trade on
          <a
            target="_blank"
            rel="noreferrer"
            href={`https://app.uniswap.org/#/swap?chain=rinkeby&inputCurrency=${tokenIn.contract.address}&outputCurrency=${tokenOut.contract.address}&exactAmount=${amountIn}`}>
            {' '}
            uniswap
          </a>
        </p>
      )}
    </Fieldset>
  );
}
