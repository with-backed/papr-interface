import { ethers } from 'ethers';

export async function getLatestBlocktimestamp(jsonRpcProvider: string) {
  const provider = new ethers.providers.JsonRpcProvider(jsonRpcProvider);
  const block = await provider.getBlock('latest');
  return block.timestamp;
}
