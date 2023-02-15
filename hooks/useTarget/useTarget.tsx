import { BigNumber } from '@ethersproject/bignumber';
import { useConfig } from 'hooks/useConfig';
import { useTimestamp } from 'hooks/useTimestamp';
import {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useContractRead } from 'wagmi';

const TargetContext = createContext<TargetUpdate | undefined>(undefined);

const newTargetAbi = [
  {
    name: 'newTarget',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export type TargetUpdate = {
  newTarget: BigNumber;
  timestamp: number;
};

export const TargetProvider: FunctionComponent = ({ children }) => {
  const timestampResult = useTimestamp();
  const { controllerAddress } = useConfig();
  const { chainId } = useConfig();
  const { data: newTarget } = useContractRead({
    // read won't run until address is defined, using this as a pause mechanism
    // to wait for us to have the block height
    address: timestampResult ? (controllerAddress as `0x${string}`) : undefined,
    abi: newTargetAbi,
    functionName: 'newTarget',
    overrides: {
      blockTag: timestampResult?.blockNumber,
    },
    chainId,
  } as const);
  const [result, setResult] = useState<TargetUpdate | undefined>();

  useEffect(() => {
    if (timestampResult?.timestamp && newTarget) {
      setResult({ newTarget, timestamp: timestampResult.timestamp });
    }
  }, [newTarget, timestampResult]);

  return (
    <TargetContext.Provider value={result}>{children}</TargetContext.Provider>
  );
};

export function useTarget() {
  return useContext(TargetContext);
}
