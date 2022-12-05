import { useConfig } from 'hooks/useConfig';
import { SupportedToken } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import { useMemo } from 'react';
import { useSigner } from 'wagmi';

export function useSignerOrProvider() {
  const { jsonRpcProvider, tokenName } = useConfig();
  const { data: signer } = useSigner();
  const signerOrProvider = useMemo(() => {
    if (signer) {
      return signer;
    }
    return makeProvider(jsonRpcProvider, tokenName as SupportedToken);
  }, [jsonRpcProvider, tokenName, signer]);

  return signerOrProvider;
}

export function useJsonRpcProvider() {
  const { jsonRpcProvider, tokenName } = useConfig();
  const { data: signer } = useSigner();
  const provider = useMemo(() => {
    return makeProvider(jsonRpcProvider, tokenName as SupportedToken);
  }, [jsonRpcProvider, tokenName]);

  return provider;
}
