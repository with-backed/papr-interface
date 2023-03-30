import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { erc20TokenToToken } from 'lib/uniswapSubgraph';
import { useMemo } from 'react';

export function usePoolTokens() {
  const { chainId } = useConfig();
  const { paprToken, underlying, token0IsUnderlying } = useController();

  const { token0, token1 } = useMemo(() => {
    if (token0IsUnderlying)
      return {
        token0: erc20TokenToToken(underlying, chainId),
        token1: erc20TokenToToken(paprToken, chainId),
      };
    else
      return {
        token0: erc20TokenToToken(paprToken, chainId),
        token1: erc20TokenToToken(underlying, chainId),
      };
  }, [token0IsUnderlying, underlying, paprToken, chainId]);

  return {
    token0,
    token1,
  };
}
