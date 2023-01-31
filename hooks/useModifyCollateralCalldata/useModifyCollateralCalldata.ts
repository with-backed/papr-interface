import { ethers } from 'ethers';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { oracleInfoArgEncoded } from 'lib/constants';
import { deconstructFromId } from 'lib/controllers';
import { useMemo } from 'react';
import {
  IPaprController,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/PaprController';
import PaprControllerABI from 'abis/PaprController.json';
import {
  getOraclePayloadFromReservoirObject,
  OraclePriceType,
} from 'lib/oracle/reservoir';
import { useAccount } from 'wagmi';

const AddCollateralEncoderString =
  'addCollateral(tuple(address addr, uint256 id)[] collateralArr)';

interface AddCollateralArgsStruct {
  collateralArr: IPaprController.CollateralStruct[];
}

interface RemoveCollateralArgsStruct {
  sendTo: string;
  collateralArr: IPaprController.CollateralStruct[];
  oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct;
}

const RemoveCollateralEncoderString = `removeCollateral(address sendTo, tuple(address addr, uint256 id)[] collateralArr, ${oracleInfoArgEncoded})`;

const paprControllerIFace = new ethers.utils.Interface(PaprControllerABI.abi);

export function useModifyCollateralCalldata(
  depositNFTs: string[],
  withdrawNFTs: string[],
) {
  const { address } = useAccount();
  const oracleInfo = useOracleInfo(OraclePriceType.lower);

  const depositContractsAndTokenIds = useMemo(() => {
    return depositNFTs.map((id) => deconstructFromId(id));
  }, [depositNFTs]);

  const withdrawContractsAndTokenIds = useMemo(() => {
    return withdrawNFTs.map((id) => deconstructFromId(id));
  }, [withdrawNFTs]);

  const allDepositNFTsEqualContracts = useMemo(() => {
    return depositContractsAndTokenIds.every(
      ([contractAddress, _]) =>
        contractAddress === depositContractsAndTokenIds[0][0],
    );
  }, [depositContractsAndTokenIds]);

  const allWithdrawNFTsEqualContracts = useMemo(() => {
    return withdrawContractsAndTokenIds.every(
      ([contractAddress, _]) =>
        contractAddress === withdrawContractsAndTokenIds[0][0],
    );
  }, [withdrawContractsAndTokenIds]);

  const addCollateralCalldata = useMemo(() => {
    if (
      !address ||
      depositContractsAndTokenIds.length === 0 ||
      !allDepositNFTsEqualContracts
    )
      return '';

    const addCollateralArgs: AddCollateralArgsStruct = {
      collateralArr: depositContractsAndTokenIds.map(
        ([contractAddress, tokenId]) => ({
          addr: contractAddress,
          id: ethers.BigNumber.from(tokenId),
        }),
      ),
    };

    return paprControllerIFace.encodeFunctionData(AddCollateralEncoderString, [
      addCollateralArgs.collateralArr,
    ]);
  }, [address, depositContractsAndTokenIds, allDepositNFTsEqualContracts]);

  const removeCollateralCalldata = useMemo(() => {
    if (
      withdrawContractsAndTokenIds.length === 0 ||
      !allWithdrawNFTsEqualContracts
    )
      return '';

    const removeCollateralArgs: RemoveCollateralArgsStruct = {
      sendTo: address!,
      collateralArr: withdrawContractsAndTokenIds.map(
        ([contractAddress, tokenId]) => ({
          addr: contractAddress,
          id: ethers.BigNumber.from(tokenId),
        }),
      ),
      oracleInfo: getOraclePayloadFromReservoirObject(
        oracleInfo && oracleInfo[withdrawContractsAndTokenIds[0][0]],
      ),
    };

    return paprControllerIFace.encodeFunctionData(
      RemoveCollateralEncoderString,
      [
        removeCollateralArgs.sendTo,
        removeCollateralArgs.collateralArr,
        removeCollateralArgs.oracleInfo,
      ],
    );
  }, [
    address,
    withdrawContractsAndTokenIds,
    allWithdrawNFTsEqualContracts,
    oracleInfo,
  ]);

  return { addCollateralCalldata, removeCollateralCalldata };
}
