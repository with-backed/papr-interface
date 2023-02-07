import { BigNumber } from '@ethersproject/bignumber';
import { useConfig } from 'hooks/useConfig';
import { createContext, FunctionComponent, useContext } from 'react';
import { useContractRead } from 'wagmi';

const TargetContext = createContext<BigNumber | undefined>(undefined);

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

export const TargetProvider: FunctionComponent = ({ children }) => {
  const { controllerAddress } = useConfig();
  const { chainId } = useConfig();
  const { data: newTarget } = useContractRead({
    address: controllerAddress as `0x${string}`,
    abi: newTargetAbi,
    functionName: 'newTarget',
    staleTime: 1000 * 60 * 2, // refresh target every 2 minutes
    chainId,
  } as const);

  return (
    <TargetContext.Provider value={newTarget}>
      {children}
    </TargetContext.Provider>
  );
};

export function useTarget() {
  return useContext(TargetContext);
}
