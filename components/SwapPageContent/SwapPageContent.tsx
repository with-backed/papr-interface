import { SwapWidget, Theme } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import { useConfig } from 'hooks/useConfig';
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
  const { chainId, jsonRpcProvider } = useConfig();
  const { data: signer } = useSigner();

  const jsonRpcUrlMap = useMemo(
    () => ({ [chainId]: jsonRpcProvider }),
    [chainId, jsonRpcProvider],
  );
  return (
    <div className={styles.wrapper}>
      <SwapWidget
        theme={theme}
        jsonRpcUrlMap={jsonRpcUrlMap}
        provider={signer?.provider as any}
      />
    </div>
  );
}
