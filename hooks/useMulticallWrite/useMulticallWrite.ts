import PaprControllerABI from 'abis/PaprController.json';
import { useController } from 'hooks/useController';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { useMemo } from 'react';
import { ethers } from 'ethers';

export function useMulticallWrite(
  calldata: string[],
  skip: boolean,
  refresh: () => void,
) {
  const controller = useController();
  const { config: multicallConfig } = usePrepareContractWrite({
    address: skip ? undefined : (controller.id as `0x${string}`),
    abi: PaprControllerABI.abi,
    functionName: 'multicall',
    args: [calldata as `0x${string}`[]],
  });
  const gasLimit = useMemo(() => {
    if (!multicallConfig.request) return ethers.BigNumber.from(0);
    return multicallConfig.request.gasLimit.add(5000);
  }, [multicallConfig]);

  const { data, write, error } = useContractWrite({
    ...{
      ...multicallConfig,
      request: {
        ...multicallConfig.request,
        gasLimit,
      },
    },
    onSuccess: (data: any) => {
      data.wait().then(refresh);
    },
  } as any);

  return { data, write, error };
}
