import { ethers } from 'ethers';
import { SWAP_FEE_BIPS, SWAP_FEE_TO } from 'lib/controllers/fees';
import { getCurrentUnixTime } from 'lib/duration';
import { useMemo } from 'react';
import { IPaprController } from 'types/generated/abis/PaprController';

const emptySwapParams: IPaprController.SwapParamsStruct = {
  amount: ethers.BigNumber.from(0),
  minOut: ethers.BigNumber.from(0),
  sqrtPriceLimitX96: ethers.BigNumber.from(0),
  swapFeeBips: ethers.BigNumber.from(0),
  swapFeeTo: ethers.constants.AddressZero,
  deadline: ethers.BigNumber.from(0),
};

export function useSwapParams(
  amount: ethers.BigNumber,
  minOut: ethers.BigNumber | null,
) {
  const swapParams: IPaprController.SwapParamsStruct = useMemo(() => {
    if (!minOut) return emptySwapParams;
    return {
      amount,
      minOut,
      deadline: getCurrentUnixTime().add(ethers.BigNumber.from(60)),
      sqrtPriceLimitX96: ethers.BigNumber.from(0),
      swapFeeTo: SWAP_FEE_TO,
      swapFeeBips: SWAP_FEE_BIPS,
    };
  }, [amount, minOut]);

  return swapParams;
}
