import { TransactionButton } from 'components/Button';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useController } from 'hooks/useController';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { pirsch } from 'lib/pirsch';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ERC721__factory } from 'types/generated/abis';
import {
  erc721ABI,
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';

type ApproveNFTButtonProps = {
  collateralContractAddress: string;
  approved: boolean;
  setApproved: (val: boolean) => void;
};

export function ApproveNFTButton({
  collateralContractAddress,
  approved,
  setApproved,
}: ApproveNFTButtonProps) {
  const paprController = useController();
  const { address } = useAccount();
  const signerOrProvider = useSignerOrProvider();
  const [approvedLoading, setApprovedLoading] = useState<boolean>(true);
  const [alreadyApproved, setAlreadyApproved] = useState<boolean>(false);

  const collateralContract = useMemo(() => {
    return ERC721__factory.connect(collateralContractAddress, signerOrProvider);
  }, [collateralContractAddress, signerOrProvider]);

  const initializeApproved = useCallback(async () => {
    const approved = await collateralContract.isApprovedForAll(
      address!,
      paprController.id,
    );
    setApproved(approved);
    setAlreadyApproved(approved);
    setApprovedLoading(false);
  }, [collateralContract, paprController.id, address, setApproved]);

  useEffect(() => {
    initializeApproved();
  }, [initializeApproved]);

  const symbol = useAsyncValue(
    () => collateralContract.symbol(),
    [collateralContract],
  );
  const { config } = usePrepareContractWrite({
    address: collateralContract.address as `0x${string}`,
    abi: erc721ABI,
    functionName: 'setApprovalForAll',
    args: [paprController.id as `0x${string}`, true],
  });
  const { data, write, error } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      data.wait().then(() => {
        pirsch(`NFT ${symbol} approved`, {});
        setApproved(true);
      });
    },
    onError: () => {
      pirsch(`NFT ${symbol} approval failed`, {});
    },
  });

  if (alreadyApproved) {
    return (
      <TransactionButton
        kind="regular"
        size="small"
        theme="meme"
        completed
        text={symbol ? `Approve ${symbol}` : '...'}
      />
    );
  }

  return (
    <TransactionButton
      kind="regular"
      size="small"
      theme="papr"
      onClick={write!}
      transactionData={data}
      error={error?.message}
      disabled={approvedLoading}
      text={symbol ? `Approve ${symbol}` : '...'}
    />
  );
}
