import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useConfig } from 'hooks/useConfig';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { erc20ABI, useAccount, useContractRead, useNetwork } from 'wagmi';

type Balance = ethers.BigNumber | null;
type ContextValue = {
  balance: Balance;
  refresh: () => void;
  register: (debtTokenAddress: string) => void;
};

const PaprBalanceContext = createContext<ContextValue>({} as any);

export function PaprBalanceProvider({ children }: PropsWithChildren<{}>) {
  const { address: connectedAddress } = useAccount();
  const { chain } = useNetwork();
  const { chainId } = useConfig();
  const [debtTokenAddress, setDebtTokenAddress] = useState<string | undefined>(
    undefined,
  );

  const { data: rawPaprBalance, refetch: refresh } = useContractRead({
    // If address is undefined, hook will not run. Take advantage of this
    // to not run the hook if there is no connected user.
    address:
      chain?.id !== chainId || !connectedAddress
        ? undefined
        : (debtTokenAddress as `0x${string}`),
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [connectedAddress as `0x${string}`],
    staleTime: 1000 * 60 * 2, // refresh balance every 2 minutes
  });

  const balance: Balance = useMemo(() => {
    if (!rawPaprBalance) {
      return null;
    }
    return ethers.BigNumber.from(rawPaprBalance);
  }, [rawPaprBalance]);

  const register = useCallback(
    (address: string) => {
      const normalizedAddress = getAddress(address);
      // We should only track one papr debt token at a time (the pages are
      // scoped to a single token). Don't re-register if the token is the same.
      if (debtTokenAddress && normalizedAddress === debtTokenAddress) {
        return;
      }
      setDebtTokenAddress(address);
    },
    [debtTokenAddress],
  );

  const value: ContextValue = useMemo(
    () => ({
      balance,
      refresh,
      register,
    }),
    [balance, refresh, register],
  );

  return (
    <PaprBalanceContext.Provider value={value}>
      {children}
    </PaprBalanceContext.Provider>
  );
}

export function usePaprBalance(debtTokenAddress: string) {
  const { register, ...rest } = useContext(PaprBalanceContext);

  useEffect(() => {
    register(debtTokenAddress);
  }, [debtTokenAddress, register]);

  return rest;
}
