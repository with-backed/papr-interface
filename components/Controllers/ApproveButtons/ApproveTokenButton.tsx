import { ethers } from 'ethers';
import {
  erc20ABI,
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { TransactionButton } from 'components/Button';
import { ERC20__factory } from 'types/generated/abis';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { useController } from 'hooks/useController';
import { ERC20Token } from 'lib/controllers';

type ApproveTokenButtonProps = {
  token: ERC20Token;
  tokenApproved: boolean;
  setTokenApproved: (val: boolean) => void;
};

export function ApproveTokenButton({
  token,
  tokenApproved,
  setTokenApproved,
}: ApproveTokenButtonProps) {
  const controller = useController();
  const { address } = useAccount();
  const signerOrProvider = useSignerOrProvider();

  const [approvedLoading, setApprovedLoading] = useState<boolean>(true);

  const initializeUnderlyingApproved = useCallback(async () => {
    if (!address) {
      return;
    }
    const connectedToken = await ERC20__factory.connect(
      token.id,
      signerOrProvider,
    );
    if (
      (await connectedToken.allowance(address, controller.id)) >
      ethers.BigNumber.from(0)
    ) {
      setTokenApproved(true);
    }
    setApprovedLoading(false);
  }, [controller, address, setTokenApproved, signerOrProvider, token]);

  useEffect(() => {
    initializeUnderlyingApproved();
  });

  const { config } = usePrepareContractWrite({
    address: token.id as `0x${string}`,
    abi: erc20ABI,
    functionName: 'approve',
    args: [controller.id as `0x${string}`, ethers.constants.MaxInt256],
  });
  const { data, write, error } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      data.wait().then(() => setTokenApproved(true));
    },
  });

  if (tokenApproved || approvedLoading) return <></>;

  return (
    <TransactionButton
      kind="regular"
      size="small"
      theme="papr"
      onClick={write!}
      transactionData={data}
      error={error?.message}
      text={`Approve ${token.symbol}`}
      completed={tokenApproved}
    />
  );
}
