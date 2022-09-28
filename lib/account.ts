import { ethers } from 'ethers';

export function resolveEns(address: string, jsonRpcProvider: string) {
  const provider = new ethers.providers.JsonRpcProvider(jsonRpcProvider);

  return provider.resolveName(address);
}

export function addressToENS(address: string, jsonRpcProvider: string) {
  const provider = new ethers.providers.JsonRpcProvider(jsonRpcProvider);

  return provider.lookupAddress(address);
}
