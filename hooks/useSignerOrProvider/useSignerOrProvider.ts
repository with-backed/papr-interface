import { useConfig } from 'hooks/useConfig';
import { SupportedNetwork } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import { useMemo } from 'react';
import { useSigner } from 'wagmi';

export function useSignerOrProvider() {
  const { jsonRpcProvider, network } = useConfig();
  const { data: signer } = useSigner();
  const signerOrProvider = useMemo(() => {
    if (signer) {
      return signer;
    }
    return makeProvider(jsonRpcProvider, network as SupportedNetwork);
  }, [jsonRpcProvider, network, signer]);

  return signerOrProvider;
}
