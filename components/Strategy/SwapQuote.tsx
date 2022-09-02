import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
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
  tokenIn: ERC20Token;
  tokenOut: ERC20Token;
  fee: ethers.BigNumber;
};

export default function SwapQuote({ tokenIn, tokenOut, fee }: QuoteProps) {
  const [amountIn, setAmountIn] = useState<string>('');
  const [quote, setQuote] = useState<string>('');
  const [internalAPRAfter, setInternalAPRAfter] =
    useState<string>('coming soon');
  const [priceImpact, setPriceImpact] = useState<number>(0.0);
  const { jsonRpcProvider, network } = useConfig();
  const getQuote = useCallback(async () => {
    const amount = ethers.utils.parseUnits(amountIn, tokenIn.decimals);
    const quoter = Quoter(jsonRpcProvider, network as SupportedNetwork);
    const q = await getQuoteForSwap(quoter, amount, tokenIn, tokenOut);

    setQuote(
      ethers.utils.formatUnits(q, ethers.BigNumber.from(tokenOut.decimals)),
    );
    setPriceImpact(
      await computeSlippageForSwap(q, tokenIn, tokenOut, amount, quoter),
    );
  }, [amountIn, fee, jsonRpcProvider, network, tokenIn, tokenOut]);

  return (
    <Fieldset legend={`💱 ${tokenIn.symbol} ➡ ${tokenOut.symbol}`}>
      <input
        placeholder={`Enter ${tokenIn.symbol} amount`}
        value={amountIn}
        onChange={(e) => setAmountIn(e.target.value.trim())}></input>
      <button onClick={getQuote}> get quote </button>
      <p>
        {quote} {tokenOut.symbol} <br />
        {!!quote && <span>price impact: {priceImpact}%</span>}
      </p>
      {!!quote && (
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
