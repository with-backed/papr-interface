import { JsonRpcSigner } from '@ethersproject/providers';
import { SwapWidget, Theme } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useMemo } from 'react';
import { useSigner } from 'wagmi';
import styles from './SwapPageContent.module.css';

const theme: Theme = {
  primary: '#000',
  secondary: '#000',
  interactive: '#C6E6E1',
  container: '#FFF',
  module: '#F2F9F8',
  accent: '#0000EE',
  outline: '#000',
  dialog: '#000',
  fontFamily: 'Courier Prime',
  borderRadius: 0.5,
};

export function SwapPageContent() {
  const { paprToken, underlying } = useController();
  const { chainId, jsonRpcProvider, tokenName } = useConfig();
  const provider = useSigner<JsonRpcSigner>().data?.provider;

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

  return (
    <div className={styles.wrapper}>
      <SwapWidget
        theme={theme}
        jsonRpcUrlMap={jsonRpcUrlMap}
        provider={provider}
        tokenList={tokenList}
        defaultInputTokenAddress={paprToken.id}
        defaultOutputTokenAddress={underlying.id}
      />
    </div>
  );
}
