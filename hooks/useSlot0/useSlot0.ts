import { useController } from 'hooks/useController';
import { useContractRead } from 'wagmi';

export const slot0Abi = [
  {
    inputs: [],
    name: 'slot0',
    outputs: [
      {
        internalType: 'uint160',
        name: 'sqrtPriceX96',
        type: 'uint160',
      },
      {
        internalType: 'int24',
        name: 'tick',
        type: 'int24',
      },
      {
        internalType: 'uint16',
        name: 'observationIndex',
        type: 'uint16',
      },
      {
        internalType: 'uint16',
        name: 'observationCardinality',
        type: 'uint16',
      },
      {
        internalType: 'uint16',
        name: 'observationCardinalityNext',
        type: 'uint16',
      },
      {
        internalType: 'uint8',
        name: 'feeProtocol',
        type: 'uint8',
      },
      {
        internalType: 'bool',
        name: 'unlocked',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useSlot0() {
  const { poolAddress } = useController();

  const { data: poolData, isLoading } = useContractRead({
    // skip query if the auction is not completed, or we're waiting for the timestamp
    address: poolAddress as `0x${string}`,
    abi: slot0Abi,
    functionName: 'slot0',
  });

  return { poolData, loading: isLoading };
}
