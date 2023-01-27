import PaprControllerABI from 'abis/PaprController.json';
import { TransactionButton } from 'components/Button';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useController } from 'hooks/useController';
import { useModifyCollateralCalldata } from 'hooks/useModifyCollateralCalldata/useModifyCollateralCalldata';
import { useMulticallWrite } from 'hooks/useMulticallWrite/useMulticallWrite';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { oracleInfoArgEncoded, swapParamsArgEncoded } from 'lib/constants';
import { ERC20Token } from 'lib/controllers';
import { SWAP_FEE_BIPS, SWAP_FEE_TO } from 'lib/controllers/fees';
import { getCurrentUnixTime } from 'lib/duration';
import { getOraclePayloadFromReservoirObject } from 'lib/oracle/reservoir';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ERC20__factory, ERC721__factory } from 'types/generated/abis';
import {
  IPaprController,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/PaprController';
import {
  erc20ABI,
  erc721ABI,
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';

const paprControllerIFace = new ethers.utils.Interface(PaprControllerABI.abi);

const increaseDebtEncoderString = `increaseDebt(address mintTo, address asset, uint256 amount, ${oracleInfoArgEncoded})`;

interface IncreaseDebtArgsStruct {
  mintTo: string;
  asset: string;
  amount: ethers.BigNumber;
  oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct;
}
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TransactionButton } from 'components/Button';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { ERC20__factory, ERC721__factory } from 'types/generated/abis';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { useController } from 'hooks/useController';
import { useVaultWrite } from 'hooks/useVaultWrite/useVaultWrite';
import { VaultWriteType } from 'hooks/useVaultWrite/helpers';
import { ERC20Token } from 'lib/controllers';

type VaultWriteButtonProps = {
  writeType: VaultWriteType;
  collateralContractAddress: string;
  depositNFTs: string[];
  withdrawNFTs: string[];
  amount: ethers.BigNumber;
  quote: ethers.BigNumber | null;
  vaultHasDebt: boolean;
  disabled: boolean;
  refresh: () => void;
};

export function VaultWriteButton({
  writeType,
  collateralContractAddress,
  depositNFTs,
  withdrawNFTs,
  amount,
  quote,
  vaultHasDebt,
  disabled,
  refresh,
}: VaultWriteButtonProps) {
  const { data, write, error } = useVaultWrite(
    writeType,
    collateralContractAddress,
    depositNFTs,
    withdrawNFTs,
    amount,
    quote,
    refresh,
  );

  return (
    <TransactionButton
      kind="regular"
      size="small"
      theme="papr"
      onClick={write!}
      transactionData={data}
      error={error?.message}
      text={vaultHasDebt ? 'Update Loan' : 'Borrow'}
      disabled={disabled}
    />
  );
}

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
      data.wait().then(() => setApproved(true));
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
