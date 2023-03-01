import '@uniswap/widgets/fonts.css';

import { JsonRpcSigner } from '@ethersproject/providers';
import { CurrencyAmount } from '@uniswap/sdk-core';
import {
  Currency,
  Field,
  OnInitialSwapQuote,
  OnSwapPriceUpdateAck,
  SwapWidget,
  Theme,
  TradeType,
} from '@uniswap/widgets';
import { Fieldset } from 'components/Fieldset';
import { Tooltip } from 'components/Tooltip';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useTheme } from 'hooks/useTheme';
import { SupportedToken } from 'lib/config';
import { getQuoteForSwap, getQuoteForSwapOutput } from 'lib/controllers';
import { price } from 'lib/controllers/charts/mark';
import { SWAP_FEE_BIPS, SWAP_FEE_TO } from 'lib/controllers/fees';
import { erc20TokenToToken } from 'lib/uniswapSubgraph';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TooltipReference, useTooltipState } from 'reakit';
import { useSigner } from 'wagmi';

import { ImpactProjection } from './ImpactProjection';
import styles from './SwapPageContent.module.css';

const BASE_THEME: Theme = {
  primary: '#000',
  secondary: '#000',
  interactive: '#C6E6E1', // -20
  container: '#FFF',
  module: '#F2F9F8', // -5
  accent: '#0000EE',
  outline: '#000',
  dialog: '#fff',
  fontFamily: 'Courier Prime',
  borderRadius: 0.5,
};

export function SwapPageContent() {
  const { paprToken, underlying, token0IsUnderlying } = useController();
  const { chainId, jsonRpcProvider, tokenName } = useConfig();
  const paprTheme = useTheme();
  const feeTooltip = useTooltipState();
  const provider = useSigner<JsonRpcSigner>().data?.provider;
  const [paprTokenField, setPaprTokenField] = useState<Field | null>(
    Field.OUTPUT,
  );
  const [amounts, setAmounts] = useState<{
    input: CurrencyAmount<Currency>;
    output: CurrencyAmount<Currency>;
    tradeType: TradeType;
  } | null>(null);
  const [paprPrice, setPaprPrice] = useState<number | null>(null);

  const jsonRpcUrlMap = useMemo(
    () => ({ [chainId]: jsonRpcProvider }),
    [chainId, jsonRpcProvider],
  );

  const tokenList = useMemo(
    () => [
      {
        address: underlying.id,
        chainId,
        decimals: underlying.decimals,
        name: underlying.name,
        symbol: underlying.symbol,
      },
      {
        address: paprToken.id,
        chainId,
        decimals: paprToken.decimals,
        name: tokenName,
        symbol: tokenName,
      },
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        chainId,
        decimals: 18,
        name: 'Dai Stablecoin',
        symbol: 'DAI',
      },
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId,
        decimals: 6,
        name: 'USD Coin',
        symbol: 'USDC',
      },
    ],
    [chainId, paprToken, tokenName, underlying],
  );

  const swapWidgetTheme = useMemo(() => {
    switch (paprTheme) {
      case 'hero':
        return { ...BASE_THEME, interactive: '#dddbff', module: '#f8f7ff' };
      case 'meme':
        return { ...BASE_THEME, interactive: '#c6e6e1', module: '#f2f9f8' };
      case 'trash':
        return { ...BASE_THEME, interactive: '#ffd7cc', module: '#fef5f2' };
      case 'papr':
        return { ...BASE_THEME, interactive: '#cce0fe', module: '#f5f9ff' };
    }
  }, [paprTheme]);

  const sqrtPriceAfter = useAsyncValue(async () => {
    if (!amounts) return null;
    const paprIn = paprTokenField === Field.INPUT;
    const paprOut = paprTokenField === Field.OUTPUT;

    if (paprIn) {
      const quoteResult = await getQuoteForSwap(
        ethers.utils.parseUnits(
          amounts.input.toExact(),
          amounts.input.currency.decimals,
        ),
        amounts.input.currency.wrapped.address,
        underlying.id,
        tokenName as SupportedToken,
      );
      return quoteResult.sqrtPriceX96After;
    } else if (paprOut) {
      const quoteResult = await getQuoteForSwapOutput(
        ethers.utils.parseUnits(
          amounts.output.toExact(),
          amounts.output.currency.decimals,
        ),
        underlying.id,
        amounts.output.currency.wrapped.address,
        tokenName as SupportedToken,
      );
      return quoteResult.sqrtPriceX96After;
    } else {
      return null;
    }
  }, [amounts, tokenName, paprTokenField, underlying.id]);

  useEffect(() => {
    if (!sqrtPriceAfter || !amounts) return;
    if (!paprTokenField) {
      setPaprPrice(null);
      return;
    }

    const paprUniswapToken = erc20TokenToToken(paprToken, chainId);
    const underlyingUniswapToken = erc20TokenToToken(underlying, chainId);
    const token0 = token0IsUnderlying
      ? underlyingUniswapToken
      : paprUniswapToken;

    const p = price(
      sqrtPriceAfter,
      paprUniswapToken,
      underlyingUniswapToken,
      token0,
    ).toFixed();
    setPaprPrice(parseFloat(p));
  }, [
    sqrtPriceAfter,
    paprTokenField,
    amounts,
    token0IsUnderlying,
    underlying,
    paprToken,
    chainId,
  ]);

  const OnSwitchTokens = useCallback(() => {
    if (!paprTokenField) return;
    if (paprTokenField == Field.INPUT) {
      setPaprTokenField(Field.OUTPUT);
    } else {
      setPaprTokenField(Field.INPUT);
    }
  }, [paprTokenField]);

  const OnTokenChange = useCallback(
    (field: Field, token: Currency) => {
      if (field == paprTokenField) {
        // changing papr token field
        if (
          field == paprTokenField &&
          (!token.isToken || token.address.toLowerCase() !== paprToken.id)
        ) {
          // setting papr token to something else
          setPaprPrice(null);
          setPaprTokenField(null);
          return;
        }
        // setting papr token field to papr token
        return;
      } else {
        // changing field that is not paprTokenField
        if (token.isToken && token.address.toLowerCase() == paprToken.id) {
          setPaprTokenField(field);
        }
      }
    },
    [paprToken, paprTokenField],
  );

  const onInitialSwapQuote: OnInitialSwapQuote = useCallback(
    ({ inputAmount, outputAmount, tradeType }) => {
      setAmounts({
        input: inputAmount,
        output: outputAmount,
        tradeType,
      });
    },
    [],
  );

  const onSwapPriceUpdateAck: OnSwapPriceUpdateAck = useCallback(
    (_stale, { inputAmount, outputAmount, tradeType }) => {
      setAmounts({
        input: inputAmount,
        output: outputAmount,
        tradeType,
      });
    },
    [],
  );

  return (
    <div className={styles.wrapper}>
      <Fieldset legend="🦄 Uniswap">
        <SwapWidget
          theme={swapWidgetTheme}
          jsonRpcUrlMap={jsonRpcUrlMap}
          provider={provider}
          tokenList={tokenList}
          defaultInputTokenAddress={''}
          defaultOutputTokenAddress={paprToken.id}
          hideConnectionUI={true}
          onInitialSwapQuote={onInitialSwapQuote}
          onSwapPriceUpdateAck={onSwapPriceUpdateAck}
          onSwitchTokens={OnSwitchTokens}
          onTokenChange={OnTokenChange}
          convenienceFee={SWAP_FEE_BIPS}
          convenienceFeeRecipient={SWAP_FEE_TO}
          width="100%"
        />
        <TooltipReference {...feeTooltip}>
          <p className={styles.fee}>papr.wtf swap fee: 0.3%</p>
        </TooltipReference>
        <Tooltip {...feeTooltip}>
          Papr protocol itself has no fees. This is an app fee to support
          operation of this website.
        </Tooltip>
      </Fieldset>
      <ImpactProjection paprPrice={paprPrice} />
    </div>
  );
}
