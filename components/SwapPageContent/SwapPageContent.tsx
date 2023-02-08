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
import { Tooltip } from 'components/Tooltip';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useTheme } from 'hooks/useTheme';
import { SWAP_FEE_BIPS, SWAP_FEE_TO } from 'lib/controllers/fees';
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
  const { paprToken, underlying } = useController();
  const { chainId, jsonRpcProvider, tokenName } = useConfig();
  const paprTheme = useTheme();
  const feeTooltip = useTooltipState();
  const provider = useSigner<JsonRpcSigner>().data?.provider;
  const [paprTokenField, setPaprTokenField] = useState<Field | null>(
    Field.OUTPUT,
  );
  const [executionPrice, setExecutionPrice] = useState<number | null>(null);
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

  useEffect(() => {
    if (!executionPrice) return;
    if (!paprTokenField) {
      setPaprPrice(null);
      return;
    }

    let p = executionPrice;
    if (paprTokenField == Field.OUTPUT) {
      p = 1 / executionPrice;
    }
    setPaprPrice(p);
  }, [executionPrice, paprTokenField]);

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
    ({ executionPrice }) => {
      setExecutionPrice(parseFloat(executionPrice.toFixed(6)));
    },
    [],
  );

  const onSwapPriceUpdateAck: OnSwapPriceUpdateAck = useCallback(
    (_stale, update) => {
      setExecutionPrice(parseFloat(update.executionPrice.toFixed(6)));
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
      <ImpactProjection marketPriceImpact={paprPrice} />
    </div>
  );
}
