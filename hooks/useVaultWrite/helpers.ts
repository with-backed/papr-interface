import { ethers } from 'ethers';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { getOraclePayloadFromReservoirObject } from 'lib/oracle/reservoir';
import {
  IPaprController,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/PaprController';
import PaprControllerABI from 'abis/PaprController.json';
import { oracleInfoArgEncoded, swapParamsArgEncoded } from 'lib/constants';

export enum VaultWriteType {
  Borrow = 'borrow',
  Repay = 'repay',
  BorrowWithSwap = 'borrowWithSwap',
  RepayWithSwap = 'repayWithSwap',
}

const paprControllerIFace = new ethers.utils.Interface(PaprControllerABI.abi);

const increaseDebtEncoderString = `increaseDebt(address mintTo, address asset, uint256 amount, ${oracleInfoArgEncoded})`;
interface IncreaseDebtArgsStruct {
  mintTo: string;
  asset: string;
  amount: ethers.BigNumber;
  oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct;
}
export function generateBorrowCalldata(
  collateralContractAddress: string,
  address: string,
  amount: ethers.BigNumber,
  oracleInfo: OracleInfo | undefined,
) {
  if (amount.isZero()) return '';
  const increaseDebtArgs: IncreaseDebtArgsStruct = {
    mintTo: address,
    asset: collateralContractAddress,
    amount,
    oracleInfo: getOraclePayloadFromReservoirObject(
      oracleInfo && oracleInfo[collateralContractAddress],
    ),
  };

  return paprControllerIFace.encodeFunctionData(increaseDebtEncoderString, [
    increaseDebtArgs.mintTo,
    increaseDebtArgs.asset,
    increaseDebtArgs.amount,
    increaseDebtArgs.oracleInfo,
  ]);
}

const reduceDebtEncoderString = `reduceDebt(address account, address asset, uint256 amount)`;
interface ReduceDebtArgsStruct {
  account: string;
  asset: string;
  amount: ethers.BigNumber;
}
export function generateRepayCalldata(
  collateralContractAddress: string,
  address: string,
  amount: ethers.BigNumber,
) {
  if (amount.isZero()) return '';

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
}

const IncreaseAndSwapEncoderString = `increaseDebtAndSell(address proceedsTo, address collateralAsset, ${swapParamsArgEncoded}, ${oracleInfoArgEncoded})`;
interface IncreaseAndSwapStruct {
  proceedsTo: string;
  collateralAsset: string;
  swapParams: IPaprController.SwapParamsStruct;
  oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct;
}
export function generateBorrowWithSwapCalldata(
  collateralContractAddress: string,
  address: string,
  swapParams: IPaprController.SwapParamsStruct,
  oracleInfo: OracleInfo | undefined,
) {
  const borrowWithSwapArgs: IncreaseAndSwapStruct = {
    proceedsTo: address,
    collateralAsset: collateralContractAddress,
    swapParams,
    oracleInfo: getOraclePayloadFromReservoirObject(
      oracleInfo && oracleInfo[collateralContractAddress],
    ),
  };

  return paprControllerIFace.encodeFunctionData(IncreaseAndSwapEncoderString, [
    borrowWithSwapArgs.proceedsTo,
    borrowWithSwapArgs.collateralAsset,
    borrowWithSwapArgs.swapParams,
    borrowWithSwapArgs.oracleInfo,
  ]);
}

const BuyAndReduceEncoderString = `buyAndReduceDebt(address account, address collateralAsset, ${swapParamsArgEncoded})`;
interface BuyAndReduceArgsStruct {
  account: string;
  collateralAsset: string;
  swapParams: IPaprController.SwapParamsStruct;
}
export function generateRepayWithSwapCalldata(
  collateralContractAddress: string,
  address: string,
  swapParams: IPaprController.SwapParamsStruct,
) {
  const repayWithSwapArgs: BuyAndReduceArgsStruct = {
    account: address,
    collateralAsset: collateralContractAddress,
    swapParams,
  };

  return paprControllerIFace.encodeFunctionData(BuyAndReduceEncoderString, [
    repayWithSwapArgs.account,
    repayWithSwapArgs.collateralAsset,
    repayWithSwapArgs.swapParams,
  ]);
}
