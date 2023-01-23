import PaprControllerABI from 'abis/PaprController.json';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';

const overrides = {
  gasLimit: ethers.BigNumber.from(ethers.utils.hexValue(3000000)),
};

export function useMulticallWrite(calldata: string[], refresh: () => void) {
  const controller = useController();
  const { config: multicallConfig } = usePrepareContractWrite({
    address: controller.id as `0x${string}`,
    abi: PaprControllerABI.abi,
    functionName: 'multicall',
    args: [calldata as `0x${string}`[]],
    overrides,
  });
  const { data, write, error } = useContractWrite({
    ...multicallConfig,
    onSuccess: (data: any) => {
      data.wait().then(refresh);
    },
  } as any);

  return { data, write, error };
}
