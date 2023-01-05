import { ethers } from 'ethers';
import { PaprController } from 'lib/PaprController';
import {
  IPaprController,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/PaprController';
import PaprControllerABI from 'abis/PaprController.json';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import {
  erc20ABI,
  erc721ABI,
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TransactionButton } from 'components/Button';
import { useModifyCollateralCalldata } from 'hooks/useModifyCollateralCalldata/useModifyCollateralCalldata';
import { oracleInfoArgEncoded, swapParamsArgEncoded } from 'lib/constants';
import { getOraclePayloadFromReservoirObject } from 'lib/oracle/reservoir';
import { getAddress } from 'ethers/lib/utils';
import { useMulticallWrite } from 'hooks/useMulticallWrite/useMulticallWrite';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { ERC20, ERC721__factory } from 'types/generated/abis';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';

const paprControllerIFace = new ethers.utils.Interface(PaprControllerABI.abi);

const increaseDebtEncoderString = `increaseDebt(address mintTo, address asset, uint256 amount, ${oracleInfoArgEncoded})`;

interface IncreaseDebtArgsStruct {
  mintTo: string;
  asset: string;
  amount: ethers.BigNumber;
  oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct;
}

type BorrowOrRepayPerpetualButtonProps = {
  paprController: PaprController;
  collateralContractAddress: string;
  depositNFTs: string[];
  withdrawNFTs: string[];
  amount: ethers.BigNumber | null;
  oracleInfo: OracleInfo;
  vaultHasDebt: boolean;
  disabled: boolean;
  refresh: () => void;
};

export function BorrowPerpetualButton({
  paprController,
  collateralContractAddress,
  depositNFTs,
  withdrawNFTs,
  amount,
  oracleInfo,
  vaultHasDebt,
  disabled,
  refresh,
}: BorrowOrRepayPerpetualButtonProps) {
  const { address } = useAccount();

  const { addCollateralCalldata, removeCollateralCalldata } =
    useModifyCollateralCalldata(depositNFTs, withdrawNFTs, address, oracleInfo);

  const borrowPerpetualCalldata = useMemo(() => {
    if (!amount || amount.isZero()) return '';

    const args: IncreaseDebtArgsStruct = {
      mintTo: address!,
      asset: collateralContractAddress,
      amount,
      oracleInfo: getOraclePayloadFromReservoirObject(
        oracleInfo[getAddress(collateralContractAddress)],
      ),
    };
    return paprControllerIFace.encodeFunctionData(increaseDebtEncoderString, [
      args.mintTo,
      args.asset,
      args.amount,
      args.oracleInfo,
    ]);
  }, [amount, address, collateralContractAddress, oracleInfo]);

  const calldata = useMemo(
    () =>
      [
        addCollateralCalldata,
        removeCollateralCalldata,
        borrowPerpetualCalldata,
      ].filter((c) => !!c),
    [addCollateralCalldata, removeCollateralCalldata, borrowPerpetualCalldata],
  );

  const { data, write, error } = useMulticallWrite(
    paprController,
    calldata,
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

const reduceDebtEncoderString = `reduceDebt(address account, address asset, uint256 amount)`;

interface ReduceDebtArgsStruct {
  account: string;
  asset: string;
  amount: ethers.BigNumber;
}

export function RepayPerpetualButton({
  paprController,
  collateralContractAddress,
  depositNFTs,
  withdrawNFTs,
  amount,
  oracleInfo,
  disabled,
  refresh,
}: BorrowOrRepayPerpetualButtonProps) {
  const { address } = useAccount();

  const { addCollateralCalldata, removeCollateralCalldata } =
    useModifyCollateralCalldata(depositNFTs, withdrawNFTs, address, oracleInfo);

  const repayPerpetualCalldata = useMemo(() => {
    if (!amount || amount.isZero()) return '';

    const args: ReduceDebtArgsStruct = {
      account: address!,
      asset: collateralContractAddress,
      amount,
    };
    return paprControllerIFace.encodeFunctionData(reduceDebtEncoderString, [
      args.account,
      args.asset,
      args.amount,
    ]);
  }, [amount, address, collateralContractAddress]);

  const calldata = useMemo(
    () =>
      [
        repayPerpetualCalldata,
        addCollateralCalldata,
        removeCollateralCalldata,
      ].filter((c) => !!c),
    [addCollateralCalldata, removeCollateralCalldata, repayPerpetualCalldata],
  );

  const { data, write, error } = useMulticallWrite(
    paprController,
    calldata,
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
      text="Update Loan"
      disabled={disabled}
    />
  );
}

export const BuyAndReduceEncoderString = `buyAndReduceDebt(address account, address collateralAsset, ${swapParamsArgEncoded})`;

export interface BuyAndReduceArgsStruct {
  account: string;
  collateralAsset: string;
  swapParams: IPaprController.SwapParamsStruct;
}

type BorrowOrRepayWithSwapButtonProps = {
  paprController: PaprController;
  collateralContractAddress: string;
  depositNFTs: string[];
  withdrawNFTs: string[];
  amount: ethers.BigNumber | null;
  quote: ethers.BigNumber | null;
  oracleInfo: OracleInfo;
  vaultHasDebt: boolean;
  disabled: boolean;
  refresh: () => void;
};

export function RepayWithSwapButton({
  paprController,
  collateralContractAddress,
  depositNFTs,
  withdrawNFTs,
  amount,
  quote,
  oracleInfo,
  vaultHasDebt,
  disabled,
  refresh,
}: BorrowOrRepayWithSwapButtonProps) {
  const { address } = useAccount();

  const { addCollateralCalldata, removeCollateralCalldata } =
    useModifyCollateralCalldata(depositNFTs, withdrawNFTs, address, oracleInfo);

  const repayWithSwapCalldata = useMemo(() => {
    if (!amount || !quote || amount.isZero()) return '';
    const repayWithSwapArgs: BuyAndReduceArgsStruct = {
      account: address!,
      collateralAsset: collateralContractAddress,
      swapParams: {
        amount,
        minOut: quote,
        sqrtPriceLimitX96: ethers.BigNumber.from(0),
        swapFeeTo: ethers.constants.AddressZero,
        swapFeeBips: ethers.BigNumber.from(0),
      },
    };

    return paprControllerIFace.encodeFunctionData(BuyAndReduceEncoderString, [
      repayWithSwapArgs.account,
      repayWithSwapArgs.collateralAsset,
      repayWithSwapArgs.swapParams,
    ]);
  }, [address, collateralContractAddress, amount, quote]);

  const calldata = useMemo(
    () =>
      [
        repayWithSwapCalldata,
        addCollateralCalldata,
        removeCollateralCalldata,
      ].filter((c) => !!c),
    [addCollateralCalldata, removeCollateralCalldata, repayWithSwapCalldata],
  );

  const { data, write, error } = useMulticallWrite(
    paprController,
    calldata,
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
      text="Update Loan"
      disabled={disabled}
    />
  );
}

export const IncreaseAndSwapEncoderString = `increaseDebtAndSell(address proceedsTo, address collateralAsset, ${swapParamsArgEncoded}, ${oracleInfoArgEncoded})`;

export interface IncreaseAndSwapStruct {
  proceedsTo: string;
  collateralAsset: string;
  swapParams: IPaprController.SwapParamsStruct;
  oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct;
}

export function BorrowWithSwapButton({
  paprController,
  collateralContractAddress,
  depositNFTs,
  withdrawNFTs,
  amount,
  quote,
  oracleInfo,
  vaultHasDebt,
  disabled,
  refresh,
}: BorrowOrRepayWithSwapButtonProps) {
  const { address } = useAccount();

  const { addCollateralCalldata, removeCollateralCalldata } =
    useModifyCollateralCalldata(depositNFTs, withdrawNFTs, address, oracleInfo);

  const borrowWithSwapCalldata = useMemo(() => {
    if (!amount || !quote || amount.isZero()) return '';
    const borrowWithSwapArgs: IncreaseAndSwapStruct = {
      proceedsTo: address!,
      collateralAsset: collateralContractAddress,
      swapParams: {
        amount,
        minOut: quote,
        sqrtPriceLimitX96: ethers.BigNumber.from(0),
        swapFeeTo: ethers.constants.AddressZero,
        swapFeeBips: ethers.BigNumber.from(0),
      },
      oracleInfo: getOraclePayloadFromReservoirObject(
        oracleInfo[getAddress(collateralContractAddress)],
      ),
    };

    return paprControllerIFace.encodeFunctionData(
      IncreaseAndSwapEncoderString,
      [
        borrowWithSwapArgs.proceedsTo,
        borrowWithSwapArgs.collateralAsset,
        borrowWithSwapArgs.swapParams,
        borrowWithSwapArgs.oracleInfo,
      ],
    );
  }, [address, collateralContractAddress, amount, quote, oracleInfo]);

  const calldata = useMemo(
    () =>
      [
        addCollateralCalldata,
        removeCollateralCalldata,
        borrowWithSwapCalldata,
      ].filter((c) => !!c),
    [addCollateralCalldata, removeCollateralCalldata, borrowWithSwapCalldata],
  );

  const { data, write, error } = useMulticallWrite(
    paprController,
    calldata,
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
  controller: PaprController;
  token: ERC20;
  tokenApproved: boolean;
  setTokenApproved: (val: boolean) => void;
};

export function ApproveTokenButton({
  controller,
  token,
  tokenApproved,
  setTokenApproved,
}: ApproveTokenButtonProps) {
  const { address } = useAccount();

  const [approvedLoading, setApprovedLoading] = useState<boolean>(true);

  const initializeUnderlyingApproved = useCallback(async () => {
    if (!address) {
      return;
    }
    const connectedToken = controller.token0IsUnderlying
      ? controller.token0
      : controller.token1;
    if (
      (await connectedToken.allowance(address, controller.id)) >
      ethers.BigNumber.from(0)
    ) {
      setTokenApproved(true);
    }
    setApprovedLoading(false);
  }, [controller, address, setTokenApproved]);

  useEffect(() => {
    initializeUnderlyingApproved();
  });

  const symbol = useAsyncValue(() => token.symbol(), [token]);
  const { config } = usePrepareContractWrite({
    address: token.address as `0x${string}`,
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

  if (tokenApproved || approvedLoading || !symbol) return <></>;

  return (
    <TransactionButton
      kind="regular"
      size="small"
      theme="papr"
      onClick={write!}
      transactionData={data}
      error={error?.message}
      text={`Approve ${symbol}`}
      completed={tokenApproved}
    />
  );
}

type ApproveNFTButtonProps = {
  paprController: PaprController;
  collateralContractAddress: string;
  approved: boolean;
  setApproved: (val: boolean) => void;
};

export function ApproveNFTButton({
  paprController,
  collateralContractAddress,
  approved,
  setApproved,
}: ApproveNFTButtonProps) {
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
