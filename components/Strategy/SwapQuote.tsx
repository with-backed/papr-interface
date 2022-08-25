import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { SupportedNetwork } from 'lib/config';
import { Quoter } from 'lib/contracts';
import {
  computeEffectiveAPR,
  ERC20Token,
  LendingStrategy,
  multiplier,
} from 'lib/strategies';
import { useCallback, useState } from 'react';

type QuoteProps = {
  strategy: LendingStrategy;
  tokenIn: ERC20Token;
  tokenOut: ERC20Token;
  fee: ethers.BigNumber;
};

export default function SwapQuote({
  strategy,
  tokenIn,
  tokenOut,
  fee,
}: QuoteProps) {
  const [amountIn, setAmountIn] = useState<string>('');
  const [quote, setQuote] = useState<string>('');
  const [effectiveAprAfter, setEffectiveAprAfter] =
    useState<string>('coming soon');
  const { jsonRpcProvider, network } = useConfig();
  const getQuote = useCallback(async () => {
    console.log(amountIn);
    const amount = ethers.utils.parseUnits(amountIn, tokenIn.decimals);
    console.log(amount);
    const quoter = Quoter(jsonRpcProvider, network as SupportedNetwork);
    const q: ethers.BigNumber = await quoter.callStatic.quoteExactInputSingle(
      tokenIn.contract.address,
      tokenOut.contract.address,
      fee,
      amount,
      0,
    );

    setQuote(
      ethers.utils.formatUnits(q, ethers.BigNumber.from(tokenOut.decimals)),
    );
  }, [amountIn]);

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
      <p>
        {quote} {tokenOut.symbol}
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
    </fieldset>
  );
}
