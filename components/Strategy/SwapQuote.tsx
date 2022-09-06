import { Fieldset } from 'components/Fieldset';
import { useConfig } from 'hooks/useConfig';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import { LendingStrategy } from 'lib/strategies';
import { useState } from 'react';
import { useAccount } from 'wagmi';

type QuoteProps = {
  strategy: LendingStrategy;
  swapForUnderlying: boolean;
};

export default function SwapQuote({ strategy, swapForUnderlying }: QuoteProps) {
  const { address } = useAccount();
  const [amountIn, setAmountIn] = useState<string>('');
  const { quoteForSwap, priceImpact, tokenIn, tokenOut } = useQuoteWithSlippage(
    strategy,
    amountIn,
    swapForUnderlying,
  );
  const [internalAPRAfter, setInternalAPRAfter] =
    useState<string>('coming soon');

  return (
    <Fieldset legend={`💱 ${tokenIn.symbol} ➡ ${tokenOut.symbol}`}>
      <input
        disabled={!address}
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
