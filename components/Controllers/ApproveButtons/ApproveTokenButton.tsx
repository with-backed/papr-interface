import { TransactionButton } from 'components/Button';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { ERC20Token } from 'lib/controllers';
import { pirsch } from 'lib/pirsch';
import { useCallback, useEffect, useState } from 'react';
import { ERC20__factory } from 'types/generated/abis';
import {
  erc20ABI,
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';

type ApproveTokenButtonProps = {
  token: ERC20Token;
  tokenApproved: boolean;
  setTokenApproved: (val: boolean) => void;
  minAmountRequired?: ethers.BigNumber;
};

export function ApproveTokenButton({
  token,
  tokenApproved,
  setTokenApproved,
  minAmountRequired = ethers.BigNumber.from(0),
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
      (await connectedToken.allowance(address, controller.id)).gt(
        minAmountRequired,
      )
    ) {
      setTokenApproved(true);
    }
    setApprovedLoading(false);
  }, [
    controller,
    address,
    setTokenApproved,
    signerOrProvider,
    token,
    minAmountRequired,
  ]);

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
      data.wait().then(() => {
        pirsch(`ERC20 ${token.symbol} approved`, {});
        setTokenApproved(true);
      });
    },
    onError: () => {
      pirsch(`ERC20 ${token.symbol} approval failed`, {});
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
