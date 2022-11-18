import { ethers } from 'ethers';
import { OracleInfo, useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
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
  'addCollateral(tuple(address addr, uint256 id) collateral)';

interface AddCollateralArgsStruct {
  collateral: IPaprController.CollateralStruct;
}

interface RemoveCollateralArgsStruct {
  sendTo: string;
  collateral: IPaprController.CollateralStruct;
  oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct;
}

const RemoveCollateralEncoderString = `removeCollateral(address sendTo, tuple(address addr, uint256 id) collateral, ${oracleInfoArgEncoded})`;

const paprControllerIFace = new ethers.utils.Interface(PaprControllerABI.abi);

export function useModifyCollateralCalldata(
  depositNFTs: string[],
  withdrawNFTs: string[],
  address: string | undefined,
  oracleInfo: OracleInfo | null,
) {
  const addCollateralCalldata = useMemo(() => {
    if (!oracleInfo) return [];

    const contractsAndTokenIds = depositNFTs.map((id) => deconstructFromId(id));

    const addCollateralArgs: AddCollateralArgsStruct[] =
      contractsAndTokenIds.map(([contractAddress, tokenId]) => ({
        collateral: {
          addr: contractAddress,
          id: ethers.BigNumber.from(tokenId),
        },
      }));

    return addCollateralArgs.map((args) =>
      paprControllerIFace.encodeFunctionData(AddCollateralEncoderString, [
        args.collateral,
      ]),
    );
  }, [oracleInfo, depositNFTs]);

  const removeCollateralCalldata = useMemo(() => {
    if (!oracleInfo || !address) return [];

    const contractsAndTokenIds = withdrawNFTs.map((id) =>
      deconstructFromId(id),
    );

    const removeCollateralArgs: RemoveCollateralArgsStruct[] =
      contractsAndTokenIds.map(([contractAddress, tokenId]) => ({
        sendTo: address!,
        collateral: {
          addr: contractAddress,
          id: ethers.BigNumber.from(tokenId),
        },
        oracleInfo: getOraclePayloadFromReservoirObject(
          oracleInfo[getAddress(contractAddress)],
        ),
      }));

    return removeCollateralArgs.map((args) =>
      paprControllerIFace.encodeFunctionData(RemoveCollateralEncoderString, [
        args.sendTo,
        args.collateral,
        args.oracleInfo,
      ]),
    );
  }, [oracleInfo, withdrawNFTs, address]);

  return { addCollateralCalldata, removeCollateralCalldata };
}
