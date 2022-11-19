import {
  BuyAndReduceArgsStruct,
  BuyAndReduceEncoderString,
  MintAndSwapArgsStruct,
  MintAndSwapEncoderString,
} from 'components/LoanWriteButtons/UpdateLoanButtons';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useAsyncValue } from 'hooks/useAsyncValue';
import PaprControllerABI from 'abis/PaprController.json';
import { useConfig } from 'hooks/useConfig';
import { useModifyCollateralCalldata } from 'hooks/useModifyCollateralCalldata/useModifyCollateralCalldata';
import { OracleInfo, useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { SupportedToken } from 'lib/config';
import { Quoter } from 'lib/contracts';
import {
  deconstructFromId,
  getQuoteForSwap,
  getQuoteForSwapOutput,
} from 'lib/controllers';
import { getOraclePayloadFromReservoirObject } from 'lib/oracle/reservoir';
import { PaprController } from 'lib/PaprController';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Fieldset } from 'components/Fieldset';
import { useMulticallWrite } from 'hooks/useMulticallWrite/useMulticallWrite';
import { TransactionButton } from 'components/Button';
import { formatBigNum } from 'lib/numberFormat';

const paprControllerIFace = new ethers.utils.Interface(PaprControllerABI.abi);

type CreateOrRepayLoanProps = {
  paprController: PaprController;
  depositNFTs: string[];
  withdrawNFTs: string[];
  totalVaultsDebt: ethers.BigNumber;
  debtDesired: ethers.BigNumber;
  oracleInfo: OracleInfo;
};

export function CreateOrRepayLoan({
  paprController,
  depositNFTs,
  withdrawNFTs,
  totalVaultsDebt,
  debtDesired,
  oracleInfo,
}: CreateOrRepayLoanProps) {
  return (
    <Fieldset legend="💸 borrow">
      {totalVaultsDebt.eq(ethers.BigNumber.from(0)) && (
        <CreateLoanButton
          paprController={paprController}
          depositNFTs={depositNFTs}
          debtDesired={debtDesired}
          oracleInfo={oracleInfo}
        />
      )}
      {totalVaultsDebt.gt(ethers.BigNumber.from(0)) && (
        <RepayLoansButton
          paprController={paprController}
          withdrawNFTs={withdrawNFTs}
          totalVaultsDebt={totalVaultsDebt}
          oracleInfo={oracleInfo}
        />
      )}
    </Fieldset>
  );
}

type CreateLoanButtonProps = {
  paprController: PaprController;
  depositNFTs: string[];
  debtDesired: ethers.BigNumber;
  oracleInfo: OracleInfo;
};

export function CreateLoanButton({
  paprController,
  depositNFTs,
  debtDesired,
  oracleInfo,
}: CreateLoanButtonProps) {
  const { jsonRpcProvider, tokenName } = useConfig();
  const { address } = useAccount();

  const quote = useAsyncValue(() => {
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwap(
      quoter,
      debtDesired,
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [
    debtDesired,
    paprController.debtToken.id,
    paprController.underlying.id,
    jsonRpcProvider,
    tokenName,
  ]);

  const uniqueNFTCollections = useMemo(() => {
    return depositNFTs
      .map((id) => deconstructFromId(id)[0])
      .filter((item, i, arr) => arr.indexOf(item) === i);
  }, [depositNFTs]);

  const { addCollateralCalldata } = useModifyCollateralCalldata(
    depositNFTs,
    [],
    address,
    oracleInfo,
  );

  console.log({
    deconstructFromId,
    debtDesired: formatBigNum(debtDesired, 18),
    quote: formatBigNum(quote || ethers.BigNumber.from(0), 18),
  });

  const borrowWithSwapCalldata = useMemo(() => {
    if (!quote || !oracleInfo) return [];
    const borrowWithSwapArgs: MintAndSwapArgsStruct[] =
      uniqueNFTCollections.map((collection) => ({
        collateralAsset: collection,
        debt: debtDesired,
        minOut: quote,
        sqrtPriceLimitX96: ethers.BigNumber.from(0),
        proceedsTo: address!,
        oracleInfo: getOraclePayloadFromReservoirObject(
          oracleInfo[getAddress(collection)],
        ),
      }));
    return borrowWithSwapArgs.map((arg) =>
      paprControllerIFace.encodeFunctionData(MintAndSwapEncoderString, [
        arg.collateralAsset,
        arg.debt,
        arg.minOut,
        arg.sqrtPriceLimitX96,
        arg.proceedsTo,
        arg.oracleInfo,
      ]),
    );
  }, [quote, oracleInfo, debtDesired, address, uniqueNFTCollections]);

  const calldata = useMemo(
    () => [...addCollateralCalldata, ...borrowWithSwapCalldata],
    [addCollateralCalldata, borrowWithSwapCalldata],
  );

  const { data, write } = useMulticallWrite(paprController, calldata);

  return (
    <TransactionButton
      kind="regular"
      size="small"
      onClick={write!}
      transactionData={data}
      text={`Create Loan`}
    />
  );
}

type RepayLoansButtonProps = {
  paprController: PaprController;
  withdrawNFTs: string[];
  totalVaultsDebt: ethers.BigNumber;
  oracleInfo: OracleInfo;
};

export function RepayLoansButton({
  paprController,
  withdrawNFTs,
  totalVaultsDebt,
  oracleInfo,
}: RepayLoansButtonProps) {
  const { jsonRpcProvider, tokenName } = useConfig();
  const { address } = useAccount();

  const quote = useAsyncValue(() => {
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwapOutput(
      quoter,
      totalVaultsDebt,
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [
    totalVaultsDebt,
    paprController.debtToken.id,
    paprController.underlying.id,
    jsonRpcProvider,
    tokenName,
  ]);

  const { removeCollateralCalldata } = useModifyCollateralCalldata(
    [],
    withdrawNFTs,
    address,
    oracleInfo,
  );

  const uniqueNFTCollections = useMemo(() => {
    return withdrawNFTs
      .map((id) => deconstructFromId(id)[0])
      .filter((item, i, arr) => arr.indexOf(item) === i);
  }, [withdrawNFTs]);

  const repayWithSwapCalldata = useMemo(() => {
    if (!quote) return [];
    const repayWithSwapArgs: BuyAndReduceArgsStruct[] =
      uniqueNFTCollections.map((collection) => ({
        account: address!,
        collateralAsset: collection,
        underlyingAmount: quote,
        minOut: totalVaultsDebt,
        sqrtPriceLimitX96: ethers.BigNumber.from(0),
        proceedsTo: address!,
      }));

    return repayWithSwapArgs.map((arg) =>
      paprControllerIFace.encodeFunctionData(BuyAndReduceEncoderString, [
        arg.account,
        arg.collateralAsset,
        arg.underlyingAmount,
        arg.minOut,
        arg.sqrtPriceLimitX96,
        arg.proceedsTo,
      ]),
    );
  }, [address, quote, totalVaultsDebt, uniqueNFTCollections]);

  const calldata = useMemo(
    () => [...removeCollateralCalldata, ...repayWithSwapCalldata],
    [removeCollateralCalldata, repayWithSwapCalldata],
  );

  const { data, write } = useMulticallWrite(paprController, calldata);

  return (
    <TransactionButton
      kind="regular"
      size="small"
      onClick={write!}
      transactionData={data}
      text={`Repay Loan`}
    />
  );
}
