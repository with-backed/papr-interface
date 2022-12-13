import PaprControllerABI from 'abis/PaprController.json';
import { PaprController } from 'lib/PaprController';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { BigNumber } from '@ethersproject/bignumber';

const overrides = {
  gasLimit: BigNumber.from(hexValue(3000000)),
};

export function useMulticallWrite(
  paprController: PaprController,
  calldata: string[],
  refresh: () => void,
) {
  const { config: multicallConfig } = usePrepareContractWrite({
    address: paprController.id,
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
