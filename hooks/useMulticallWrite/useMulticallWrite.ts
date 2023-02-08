import PaprControllerABI from 'abis/PaprController.json';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { useController } from 'hooks/useController';

export function useMulticallWrite(calldata: string[], refresh: () => void) {
  const controller = useController();
  const { config: multicallConfig } = usePrepareContractWrite({
    address: controller.id as `0x${string}`,
    abi: PaprControllerABI.abi,
    functionName: 'multicall',
    args: [calldata as `0x${string}`[]],
  });
  const { data, write, error } = useContractWrite({
    ...multicallConfig,
    onSuccess: (data: any) => {
      data.wait().then(refresh);
    },
  } as any);

  return { data, write, error };
}
