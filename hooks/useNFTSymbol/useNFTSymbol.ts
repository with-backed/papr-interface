import { getAddress } from 'ethers/lib/utils.js';
import { useController } from 'hooks/useController';
import { useMemo } from 'react';

export function useNFTSymbol(contractAddress: string) {
  const { allowedCollateral } = useController();
  const nftSymbol = useMemo(
    () =>
      allowedCollateral.find(
        (ac) => getAddress(ac.token.id) === getAddress(contractAddress),
      )?.token.symbol || '',
    [allowedCollateral, contractAddress],
  );
  return nftSymbol;
}
