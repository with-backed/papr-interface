import { ethers } from 'ethers';
import { PaprController } from 'lib/PaprController';
import {
  IPaprController,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/PaprController';
import PaprControllerABI from 'abis/PaprController.json';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
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
import { oracleInfoArgEncoded } from 'lib/constants';
import { getOraclePayloadFromReservoirObject } from 'lib/oracle/reservoir';
import { getAddress } from 'ethers/lib/utils';
import { formatBigNum } from 'lib/numberFormat';
import { useMulticallWrite } from 'hooks/useMulticallWrite/useMulticallWrite';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { ERC20, ERC721, ERC721__factory } from 'types/generated/abis';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';

const paprControllerIFace = new ethers.utils.Interface(PaprControllerABI.abi);
const overrides = {
  gasLimit: ethers.BigNumber.from(ethers.utils.hexValue(3000000)),
};

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
};

export function BorrowPerpetualButton({
  paprController,
  collateralContractAddress,
  depositNFTs,
  withdrawNFTs,
  amount,
}: BorrowOrRepayPerpetualButtonProps) {
  const { address } = useAccount();
  const oracleInfo = useOracleInfo();

  const { addCollateralCalldata, removeCollateralCalldata } =
    useModifyCollateralCalldata(depositNFTs, withdrawNFTs, address, oracleInfo);

  const borrowPerpetualCalldata = useMemo(() => {
    if (!amount || !oracleInfo || amount.isZero()) return '';

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
        ...addCollateralCalldata,
        ...removeCollateralCalldata,
        borrowPerpetualCalldata,
      ].filter((c) => !!c),
    [addCollateralCalldata, removeCollateralCalldata, borrowPerpetualCalldata],
  );

  const { data, write } = useMulticallWrite(paprController, calldata);

  return (
    <TransactionButton
      kind="regular"
      size="small"
      onClick={write!}
      transactionData={data}
      text={`Update Loan`}
    />
  );
}

const reduceDebtEncoderString = `reduceDebt(address account, address asset, uint256 amount)`;

interface ReduceDebtArgsString {
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
}: BorrowOrRepayPerpetualButtonProps) {
  const { address } = useAccount();
  const oracleInfo = useOracleInfo();

  const { addCollateralCalldata, removeCollateralCalldata } =
    useModifyCollateralCalldata(depositNFTs, withdrawNFTs, address, oracleInfo);

  const borrowPerpetualCalldata = useMemo(() => {
    if (!amount || amount.isZero()) return '';

    const args: ReduceDebtArgsString = {
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
        ...addCollateralCalldata,
        ...removeCollateralCalldata,
        borrowPerpetualCalldata,
      ].filter((c) => !!c),
    [addCollateralCalldata, removeCollateralCalldata, borrowPerpetualCalldata],
  );

  const { data, write } = useMulticallWrite(paprController, calldata);

  return (
    <TransactionButton
      kind="regular"
      size="small"
      onClick={write!}
      transactionData={data}
      text={`Update Loan`}
    />
  );
}

export const BuyAndReduceEncoderString =
  'buyAndReduceDebt(address account, address collateralAsset, uint256 underlyingAmount, uint256 minOut, uint160 sqrtPriceLimitX96, address proceedsTo)';

export interface BuyAndReduceArgsStruct {
  account: string;
  collateralAsset: string;
  underlyingAmount: ethers.BigNumber;
  minOut: ethers.BigNumber;
  sqrtPriceLimitX96: ethers.BigNumber;
  proceedsTo: string;
}

type BorrowOrRepayWithSwapButtonProps = {
  paprController: PaprController;
  collateralContractAddress: string;
  depositNFTs: string[];
  withdrawNFTs: string[];
  amount: ethers.BigNumber | null;
  quote: ethers.BigNumber | null;
};

export function RepayWithSwapButton({
  paprController,
  collateralContractAddress,
  depositNFTs,
  withdrawNFTs,
  amount,
  quote,
}: BorrowOrRepayWithSwapButtonProps) {
  const { address } = useAccount();
  const oracleInfo = useOracleInfo();

  const { addCollateralCalldata, removeCollateralCalldata } =
    useModifyCollateralCalldata(depositNFTs, withdrawNFTs, address, oracleInfo);

  const repayWithSwapCalldata = useMemo(() => {
    if (!amount || !quote || amount.isZero()) return '';
    const repayWithSwapArgs: BuyAndReduceArgsStruct = {
      account: address!,
      collateralAsset: collateralContractAddress,
      underlyingAmount: amount,
      minOut: quote,
      sqrtPriceLimitX96: ethers.BigNumber.from(0),
      proceedsTo: address!,
    };

    return paprControllerIFace.encodeFunctionData(BuyAndReduceEncoderString, [
      repayWithSwapArgs.account,
      repayWithSwapArgs.collateralAsset,
      repayWithSwapArgs.underlyingAmount,
      repayWithSwapArgs.minOut,
      repayWithSwapArgs.sqrtPriceLimitX96,
      repayWithSwapArgs.proceedsTo,
    ]);
  }, [address, collateralContractAddress, amount, quote]);

  const calldata = useMemo(
    () =>
      [
        ...addCollateralCalldata,
        ...removeCollateralCalldata,
        repayWithSwapCalldata,
      ].filter((c) => !!c),
    [addCollateralCalldata, removeCollateralCalldata, repayWithSwapCalldata],
  );

  const { data, write } = useMulticallWrite(paprController, calldata);

  return (
    <TransactionButton
      kind="regular"
      size="small"
      onClick={write!}
      transactionData={data}
      text={`Update Loan`}
    />
  );
}

export const MintAndSwapEncoderString = `mintAndSellDebt(address collateralAsset, uint256 debt, uint256 minOut, uint160 sqrtPriceLimitX96, address proceedsTo, ${oracleInfoArgEncoded})`;

export interface MintAndSwapArgsStruct {
  collateralAsset: string;
  debt: ethers.BigNumber;
  minOut: ethers.BigNumber;
  sqrtPriceLimitX96: ethers.BigNumber;
  proceedsTo: string;
  oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct;
}

export function BorrowWithSwapButton({
  paprController,
  collateralContractAddress,
  depositNFTs,
  withdrawNFTs,
  amount,
  quote,
}: BorrowOrRepayWithSwapButtonProps) {
  const { address } = useAccount();
  const oracleInfo = useOracleInfo();

  const { addCollateralCalldata, removeCollateralCalldata } =
    useModifyCollateralCalldata(depositNFTs, withdrawNFTs, address, oracleInfo);

  const borrowWithSwapCalldata = useMemo(() => {
    if (!amount || !quote || !oracleInfo || amount.isZero()) return '';
    const borrowWithSwapArgs: MintAndSwapArgsStruct = {
      collateralAsset: collateralContractAddress,
      debt: amount,
      minOut: quote,
      sqrtPriceLimitX96: ethers.BigNumber.from(0),
      proceedsTo: address!,
      oracleInfo: getOraclePayloadFromReservoirObject(
        oracleInfo[getAddress(collateralContractAddress)],
      ),
    };

    return paprControllerIFace.encodeFunctionData(MintAndSwapEncoderString, [
      borrowWithSwapArgs.collateralAsset,
      borrowWithSwapArgs.debt,
      borrowWithSwapArgs.minOut,
      borrowWithSwapArgs.sqrtPriceLimitX96,
      borrowWithSwapArgs.proceedsTo,
      borrowWithSwapArgs.oracleInfo,
    ]);
  }, [address, collateralContractAddress, amount, quote, oracleInfo]);

  const calldata = useMemo(
    () =>
      [
        ...addCollateralCalldata,
        ...removeCollateralCalldata,
        borrowWithSwapCalldata,
      ].filter((c) => !!c),
    [addCollateralCalldata, removeCollateralCalldata, borrowWithSwapCalldata],
  );

  const { data, write } = useMulticallWrite(paprController, calldata);

  return (
    <TransactionButton
      kind="regular"
      size="small"
      onClick={write!}
      transactionData={data}
      text={`Update Loan`}
    />
  );
}

type ApproveTokenButtonProps = {
  controller: PaprController;
  token: ERC20;
};

export function ApproveTokenButton({
  controller,
  token,
}: ApproveTokenButtonProps) {
  const { address } = useAccount();

  const [underlyingApproved, setUnderlyingApproved] = useState<boolean>(false);

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
      setUnderlyingApproved(true);
    }
  }, [controller, address]);

  useEffect(() => {
    initializeUnderlyingApproved();
  });

  const symbol = useAsyncValue(() => token.symbol(), [token]);
  const { config } = usePrepareContractWrite({
    address: token.address,
    abi: erc20ABI,
    functionName: 'approve',
    args: [controller.id as `0x${string}`, ethers.constants.MaxInt256],
  });
  const { data, write } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      data.wait().then(() => setUnderlyingApproved(true));
    },
  });

  if (underlyingApproved) return <></>;

  return (
    <TransactionButton
      onClick={write!}
      transactionData={data}
      text={`Approve ${symbol}`}
      completed={underlyingApproved}
    />
  );
}

type ApproveNFTButtonProps = {
  paprController: PaprController;
  collateralContractAddress: string;
};

export function ApproveNFTButton({
  paprController,
  collateralContractAddress,
}: ApproveNFTButtonProps) {
  const { address } = useAccount();
  const signerOrProvider = useSignerOrProvider();
  const [approved, setApproved] = useState<true | false>(false);

  const collateralContract = useMemo(() => {
    return ERC721__factory.connect(collateralContractAddress, signerOrProvider);
  }, [collateralContractAddress, signerOrProvider]);

  const initializeApproved = useCallback(async () => {
    const approved = await collateralContract.isApprovedForAll(
      address!,
      paprController.id,
    );
    setApproved(approved);
  }, [collateralContract, paprController.id, address]);

  useEffect(() => {
    initializeApproved();
  });

  const symbol = useAsyncValue(
    () => collateralContract.symbol(),
    [collateralContract],
  );
  const { config } = usePrepareContractWrite({
    address: collateralContract.address,
    abi: erc721ABI,
    functionName: 'setApprovalForAll',
    args: [paprController.id as `0x${string}`, true],
  });
  const { data, write } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      data.wait().then(() => setApproved(true));
    },
  });

  if (approved) return <></>;

  return (
    <TransactionButton
      kind="regular"
      size="small"
      onClick={write!}
      transactionData={data}
      text={symbol ? `Approve ${symbol}` : '...'}
    />
  );
}