import PaprControllerABI from 'abis/PaprController.json';
import { useController } from 'hooks/useController';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

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
  const { data, write, error } = useContractWrite({
    ...multicallConfig,
    onSuccess: (data: any) => {
      data.wait().then(refresh);
    },
  } as any);

  return { data, write, error };
}
