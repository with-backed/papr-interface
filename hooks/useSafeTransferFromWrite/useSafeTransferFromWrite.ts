import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useSwapParams } from 'hooks/useSwapParams/useSwapParams';
import { oracleInfoArgEncoded, swapParamsArgEncoded } from 'lib/constants';
import {
  getOraclePayloadFromReservoirObject,
  OraclePriceType,
} from 'lib/oracle/reservoir';
import { useMemo } from 'react';
import {
  IPaprController,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/PaprController';
import {
  erc721ABI,
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';

const OnERC721ReceivedArgsEncoderString = `tuple(address proceedsTo, uint256 debt, ${swapParamsArgEncoded}, ${oracleInfoArgEncoded})`;

interface OnERC721ReceivedArgsStruct {
  proceedsTo: string;
  debt: ethers.BigNumber;
  swapParams: IPaprController.SwapParamsStruct;
  oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct;
}

export function useSafeTransferFromWrite(
  nftContractAddress: string,
  nftTokenId: string,
  debt: ethers.BigNumber,
  quote: ethers.BigNumber | null,
  refresh: () => void,
) {
  const controller = useController();
  const { address } = useAccount();
  const oracleInfo = useOracleInfo(OraclePriceType.lower);
  const swapParams = useSwapParams(debt, quote);

  const onERC721ReceivedData = useMemo(() => {
    const erc721ReceivedArgs: OnERC721ReceivedArgsStruct = {
      proceedsTo: address!,
      debt,
      swapParams,
      oracleInfo: getOraclePayloadFromReservoirObject(
        oracleInfo && oracleInfo[nftContractAddress],
      ),
    };
    return ethers.utils.defaultAbiCoder.encode(
      [OnERC721ReceivedArgsEncoderString],
      [erc721ReceivedArgs],
    );
  }, [debt, swapParams, oracleInfo, nftContractAddress, address]);

  const { config: safeTransferFromConfig } = usePrepareContractWrite({
    address: nftContractAddress as `0x${string}`,
    abi: erc721ABI,
    functionName: 'safeTransferFrom',
    args: [
      address as `0x${string}`,
      controller.id as `0x${string}`,
      ethers.BigNumber.from(nftTokenId),
      onERC721ReceivedData as `0x${string}`,
    ],
  });

  const { data, write, error } = useContractWrite({
    ...safeTransferFromConfig,
    onSuccess: (data: any) => {
      data.wait().then(refresh);
    },
  } as any);

  return { data, write, error };
}
