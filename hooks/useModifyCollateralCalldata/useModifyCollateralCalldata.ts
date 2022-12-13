import PaprControllerABI from 'abis/PaprController.json';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { oracleInfoArgEncoded } from 'lib/constants';
import { deconstructFromId } from 'lib/controllers';
import { getOraclePayloadFromReservoirObject } from 'lib/oracle/reservoir';
import { useMemo } from 'react';
import {
  IPaprController,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/PaprController';
import { BigNumber } from '@ethersproject/bignumber';

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
  oracleInfo: OracleInfo,
) {
  const addCollateralCalldata = useMemo(() => {
    if (!address) return [];

    const contractsAndTokenIds = depositNFTs.map((id) => deconstructFromId(id));

    const addCollateralArgs: AddCollateralArgsStruct[] =
      contractsAndTokenIds.map(([contractAddress, tokenId]) => ({
        collateral: {
          addr: contractAddress,
          id: BigNumber.from(tokenId),
        },
      }));

    return addCollateralArgs.map((args) =>
      paprControllerIFace.encodeFunctionData(AddCollateralEncoderString, [
        args.collateral,
      ]),
    );
  }, [address, depositNFTs]);

  const removeCollateralCalldata = useMemo(() => {
    if (!address) return [];

    const contractsAndTokenIds = withdrawNFTs.map((id) =>
      deconstructFromId(id),
    );

    const removeCollateralArgs: RemoveCollateralArgsStruct[] =
      contractsAndTokenIds.map(([contractAddress, tokenId]) => ({
        sendTo: address!,
        collateral: {
          addr: contractAddress,
          id: BigNumber.from(tokenId),
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
  }, [address, withdrawNFTs, oracleInfo]);

  return { addCollateralCalldata, removeCollateralCalldata };
}
