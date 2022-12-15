import { ethers } from 'ethers';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { oracleInfoArgEncoded } from 'lib/constants';
import { deconstructFromId } from 'lib/controllers';
import { useMemo } from 'react';
import {
  IPaprController,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/PaprController';
import PaprControllerABI from 'abis/PaprController.json';
import { getOraclePayloadFromReservoirObject } from 'lib/oracle/reservoir';
import { getAddress } from 'ethers/lib/utils';

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
  address: string | undefined,
  oracleInfo: OracleInfo,
) {
  const addCollateralCalldata = useMemo(() => {
    const contractsAndTokenIds = depositNFTs.map((id) => deconstructFromId(id));
    if (!address || contractsAndTokenIds.length === 0) return '';

    const addCollateralArgs: AddCollateralArgsStruct = {
      collateralArr: contractsAndTokenIds.map(([contractAddress, tokenId]) => ({
        addr: contractAddress,
        id: ethers.BigNumber.from(tokenId),
      })),
    };

    return paprControllerIFace.encodeFunctionData(AddCollateralEncoderString, [
      addCollateralArgs.collateralArr,
    ]);
  }, [address, depositNFTs]);

  const removeCollateralCalldata = useMemo(() => {
    const contractsAndTokenIds = withdrawNFTs.map((id) =>
      deconstructFromId(id),
    );
    if (!address || contractsAndTokenIds.length === 0) return '';

    const removeCollateralArgs: RemoveCollateralArgsStruct = {
      sendTo: address!,
      collateralArr: contractsAndTokenIds.map(([contractAddress, tokenId]) => ({
        addr: contractAddress,
        id: ethers.BigNumber.from(tokenId),
      })),
      oracleInfo: getOraclePayloadFromReservoirObject(
        oracleInfo[getAddress(contractsAndTokenIds[0][0])], // TODO(adamgobes): make sure we check all contract addresses are the same
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
  }, [address, withdrawNFTs, oracleInfo]);

  return { addCollateralCalldata, removeCollateralCalldata };
}
