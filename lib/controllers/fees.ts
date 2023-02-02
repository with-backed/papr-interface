import { ethers } from 'ethers';

export const SWAP_FEE_BIPS = 30;
export const SWAP_FEE_TO = '0x12Fda65b046a20C198b7C981E956176F1adC8A57';

export const calculateSwapFee = (base: ethers.BigNumber) => {
  return base.mul(SWAP_FEE_BIPS).div(10000);
};
