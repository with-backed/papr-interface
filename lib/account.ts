import { ethers } from 'ethers';

export function resolveEns(address: string, jsonRpcProvider: string) {
  const provider = new ethers.providers.JsonRpcProvider(jsonRpcProvider);

  return provider.resolveName(address);
}

export function addressToENS(address: string, jsonRpcProvider?: string) {
  const provider = new ethers.providers.JsonRpcProvider(
    jsonRpcProvider ||
      'https://eth-mainnet.g.alchemy.com/v2/De3LMv_8CYuN9WzVEgoOI5w7ltnGIhnH',
  );

  return provider.lookupAddress(address);
}
