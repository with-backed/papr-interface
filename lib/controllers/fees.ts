import { ethers } from 'ethers';

export const SWAP_FEE_BIPS = 30;
export const SWAP_FEE_TO = '0xa327C62acaE63Fa70945FDFcd252b89435400AE3';

export const calculateSwapFee = (base: ethers.BigNumber) => {
  return base.mul(SWAP_FEE_BIPS).div(10000);
};
