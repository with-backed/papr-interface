import { ethers } from 'ethers';
import { useModifyCollateralCalldata } from 'hooks/useModifyCollateralCalldata/useModifyCollateralCalldata';
import { useMulticallWrite } from 'hooks/useMulticallWrite/useMulticallWrite';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useSafeTransferFromWrite } from 'hooks/useSafeTransferFromWrite';
import { deconstructFromId } from 'lib/controllers';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import {
  generateBorrowWithSwapCalldata,
  generateBorrowCalldata,
  VaultWriteType,
  generateRepayCalldata,
  generateRepayWithSwapCalldata,
} from './helpers';
import { useSwapParams } from 'hooks/useSwapParams';

export function useVaultWrite(
  writeType: VaultWriteType,
  collateralContractAddress: string,
  depositNFTs: string[],
  withdrawNFTs: string[],
  amount: ethers.BigNumber,
  quote: ethers.BigNumber | null,
  refresh: () => void,
) {
  const { address } = useAccount();
  const oracleInfo = useOracleInfo(OraclePriceType.lower);
  const swapParams = useSwapParams(amount, quote);

  const { addCollateralCalldata, removeCollateralCalldata } =
    useModifyCollateralCalldata(depositNFTs, withdrawNFTs);

  const borrowOrRepayCalldata = useMemo(() => {
    switch (writeType) {
      case VaultWriteType.Borrow:
        return generateBorrowCalldata(
          collateralContractAddress,
          address!,
          amount,
          oracleInfo,
        );
      case VaultWriteType.Repay:
        return generateRepayCalldata(
          collateralContractAddress,
          address!,
          amount,
        );
      case VaultWriteType.BorrowWithSwap:
        return generateBorrowWithSwapCalldata(
          collateralContractAddress,
          address!,
          swapParams,
          oracleInfo,
        );
      case VaultWriteType.RepayWithSwap:
        return generateRepayWithSwapCalldata(
          collateralContractAddress,
          address!,
          swapParams,
        );
    }
  }, [
    writeType,
    collateralContractAddress,
    address,
    amount,
    swapParams,
    oracleInfo,
  ]);

  const calldata = useMemo(() => {
    if (
      writeType === VaultWriteType.Borrow ||
      writeType === VaultWriteType.BorrowWithSwap
    ) {
      return [
        addCollateralCalldata,
        removeCollateralCalldata,
        borrowOrRepayCalldata,
      ].filter((c) => !!c);
    } else {
      return [
        borrowOrRepayCalldata,
        addCollateralCalldata,
        removeCollateralCalldata,
      ].filter((c) => !!c);
    }
  }, [
    writeType,
    borrowOrRepayCalldata,
    addCollateralCalldata,
    removeCollateralCalldata,
  ]);

  const {
    data: multicallData,
    write: multicallWrite,
    error: multicallError,
  } = useMulticallWrite(calldata, refresh);

  const [_, nftTokenId] = useMemo(() => {
    if (depositNFTs.length === 0) return [ethers.constants.AddressZero, '0'];
    return deconstructFromId(depositNFTs[0]);
  }, [depositNFTs]);
  const {
    data: safeTransferFromData,
    write: safeTransferFromWrite,
    error: safeTransferFromError,
  } = useSafeTransferFromWrite(
    collateralContractAddress,
    nftTokenId,
    amount,
    quote,
    refresh,
  );

  const { data, write, error, usingSafeTransferFrom } = useMemo(() => {
    if (
      depositNFTs.length === 1 &&
      withdrawNFTs.length === 0 &&
      (writeType === VaultWriteType.Borrow ||
        writeType === VaultWriteType.BorrowWithSwap)
    )
      return {
        data: safeTransferFromData,
        write: safeTransferFromWrite,
        error: safeTransferFromError,
        usingSafeTransferFrom: true,
      };
    else {
      return {
        data: multicallData,
        write: multicallWrite,
        error: multicallError,
        usingSafeTransferFrom: false,
      };
    }
  }, [
    safeTransferFromData,
    safeTransferFromWrite,
    safeTransferFromError,
    multicallData,
    multicallWrite,
    multicallError,
    depositNFTs.length,
    withdrawNFTs.length,
    writeType,
  ]);

  return { data, write, error, usingSafeTransferFrom };
}
