import { PaprController } from 'lib/PaprController';
import PaprControllerABI from 'abis/PaprController.json';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ethers } from 'ethers';

const overrides = {
  gasLimit: ethers.BigNumber.from(ethers.utils.hexValue(3000000)),
};

export function useMulticallWrite(
  paprController: PaprController,
  calldata: string[],
) {
  const { config: multicallConfig } = usePrepareContractWrite({
    address: paprController.id,
    abi: PaprControllerABI.abi,
    functionName: 'multicall',
    args: [calldata as `0x${string}`[]],
    overrides,
  });
  const { data, write } = useContractWrite({
    ...multicallConfig,
    onSuccess: (data: any) => {
      data.wait().then(() => window.location.reload());
    },
  } as any);

  return { data, write };
}
