import '@uniswap/widgets/fonts.css';

import { JsonRpcSigner } from '@ethersproject/providers';
import {
  Currency,
  Field,
  OnInitialSwapQuote,
  OnSwapPriceUpdateAck,
  SwapWidget,
  Theme,
} from '@uniswap/widgets';
import { Fieldset } from 'components/Fieldset';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useTheme } from 'hooks/useTheme';
import { SWAP_FEE_BIPS, SWAP_FEE_TO } from 'lib/controllers/fees';
import { useCallback, useMemo, useState } from 'react';
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
  const { paprToken, underlying } = useController();
  const { chainId, jsonRpcProvider, tokenName } = useConfig();
  const paprTheme = useTheme();
  const provider = useSigner<JsonRpcSigner>().data?.provider;
  const [paprTokenField, setPaprTokenField] = useState<Field | null>(null);

  const [marketPriceImpact, setMarketPriceImpact] = useState<number | null>(
    null,
  );

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
        name: 'USD Coin',
        symbol: 'USDC',
      },
      {
        address: paprToken.id,
        chainId,
        decimals: paprToken.decimals,
        name: tokenName,
        symbol: tokenName,
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

  const updatePrice = useCallback((newPrice: number, paprField: Field) => {
    if (paprField == Field.OUTPUT) {
      newPrice = 1 / newPrice;
    }
    setMarketPriceImpact(newPrice);
  }, []);

  const OnTokenChange = useCallback(
    (field: Field, token: Currency) => {
      if (!token.isToken) return;

      if (token.address != paprToken.id) return;
      setPaprTokenField(field);

      if (!marketPriceImpact) return;

      updatePrice(marketPriceImpact, field);
    },
    [marketPriceImpact, updatePrice, paprToken],
  );

  const onInitialSwapQuote: OnInitialSwapQuote = useCallback(
    ({ executionPrice }) => {
      if (!paprTokenField) return;

      updatePrice(parseFloat(executionPrice.toFixed(6)), paprTokenField);
    },
    [paprTokenField, updatePrice],
  );

  const onSwapPriceUpdateAck: OnSwapPriceUpdateAck = useCallback(
    (_stale, update) => {
      if (!paprTokenField) return;

      updatePrice(parseFloat(update.executionPrice.toFixed(6)), paprTokenField);
    },
    [paprTokenField, updatePrice],
  );

  return (
    <div className={styles.wrapper}>
      <Fieldset legend="🦄 Uniswap">
        <SwapWidget
          theme={swapWidgetTheme}
          jsonRpcUrlMap={jsonRpcUrlMap}
          provider={provider}
          tokenList={tokenList}
          defaultInputTokenAddress={paprToken.id}
          defaultOutputTokenAddress={underlying.id}
          hideConnectionUI={true}
          onInitialSwapQuote={onInitialSwapQuote}
          onSwapPriceUpdateAck={onSwapPriceUpdateAck}
          onTokenChange={OnTokenChange}
          convenienceFee={SWAP_FEE_BIPS}
          convenienceFeeRecipient={SWAP_FEE_TO}
          width="100%"
        />
        <p className={styles.fee}>papr.wtf swap fee: 0.3%</p>
      </Fieldset>
      <ImpactProjection marketPriceImpact={marketPriceImpact} />
    </div>
  );
}
