import { TransactionButton } from 'components/Button';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { PaprController } from 'lib/PaprController';
import { getOraclePayloadFromReservoirObject } from 'lib/oracle/reservoir';
import { erc721ABI, useContractWrite, usePrepareContractWrite } from 'wagmi';
import PaprControllerABI from 'abis/Controller.json';
import {
  IPaprController,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/Controller';
import { useMemo } from 'react';
import { deconstructFromId } from 'lib/controllers';

type SafeTransferFromButtonProps = {
  controller: PaprController;
  collateralAddress: string;
  tokenId: string;
  debt: ethers.BigNumber;
  minOut: ethers.BigNumber;
  address: string;
};

const overrides = {
  gasLimit: ethers.BigNumber.from(ethers.utils.hexValue(3000000)),
};

const AddCollateralEncoderString =
  'addCollateral(tuple(address addr, uint256 id) collateral, tuple(tuple(bytes32 id, bytes payload, uint256 timestamp, bytes signature) message, tuple(uint8 v, bytes32 r, bytes32 s) sig) oracleInfo)';

interface AddCollateralArgsStruct {
  collateral: IPaprController.CollateralStruct;
  oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct;
}

const MintAndSwapEncoderString =
  'mintAndSellDebt(uint256 debt, uint256 minOut, uint160 sqrtPriceLimitX96, address proceedsTo)';

interface MintAndSwapArgsStruct {
  debt: ethers.BigNumber;
  minOut: ethers.BigNumber;
  sqrtPriceLimitX96: ethers.BigNumber;
  proceedsTo: string;
}

const OnERC721ReceivedArgsEncoderString =
  'tuple(address mintDebtOrProceedsTo, uint256 minOut, uint256 debt, uint160 sqrtPriceLimitX96, tuple(tuple(bytes32 id, bytes payload, uint256 timestamp, bytes signature) message, tuple(uint8 v, bytes32 r, bytes32 s) sig) oracleInfo)';

interface OnERC721ReceivedArgsStruct {
  mintDebtOrProceedsTo: string;
  minOut: ethers.BigNumber;
  debt: ethers.BigNumber;
  sqrtPriceLimitX96: ethers.BigNumber;
  oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct;
}

export function SafeTransferFromButton({
  controller,
  collateralAddress,
  tokenId,
  debt,
  minOut,
  address,
}: SafeTransferFromButtonProps) {
  const { config } = usePrepareContractWrite({
    address: getAddress(collateralAddress),
    abi: erc721ABI,
    functionName: 'safeTransferFrom',
    args: [
      address as `0x${string}`,
      controller.id as `0x${string}`,
      ethers.BigNumber.from(tokenId),
      ethers.utils.defaultAbiCoder.encode(
        [OnERC721ReceivedArgsEncoderString],
        [
          {
            debt,
            minOut,
            sqrtPriceLimitX96: ethers.BigNumber.from(0),
            mintDebtOrProceedsTo: address,
            oracleInfo: getOraclePayloadFromReservoirObject(
              controller.oracleInfo[getAddress(collateralAddress)],
            ),
          },
        ],
      ) as `0x${string}`,
    ],
    overrides,
  });

  const { data, write } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      // TODO: figure out how to use node to live update the vault page
      data.wait().then(() => window.location.reload());
    },
  });

  return (
    <TransactionButton
      onClick={write!}
      transactionData={data}
      text={'Borrow'}
    />
  );
}

type MintAndSellDebtButtonProps = {
  controller: PaprController;
  debt: ethers.BigNumber;
  minOut: ethers.BigNumber;
  address: string;
};

export function MintAndSellDebtButton({
  controller,
  debt,
  minOut,
  address,
}: MintAndSellDebtButtonProps) {
  const { config: mintAndSellDebtConfig } = usePrepareContractWrite({
    address: controller.id,
    abi: PaprControllerABI.abi,
    functionName: 'mintAndSellDebt',
    args: [debt, minOut, ethers.BigNumber.from(0), address as `0x${string}`],
    overrides,
  });
  const { data, write } = useContractWrite({
    ...mintAndSellDebtConfig,
    onSuccess: (data: any) => {
      data.wait().then(() => window.location.reload());
    },
  } as any);

  return (
    <TransactionButton
      onClick={write!}
      transactionData={data}
      text={'Borrow'}
    />
  );
}

type MulticallButtonProps = {
  nftsSelected: string[];
  controller: PaprController;
  debt: ethers.BigNumber;
  minOut: ethers.BigNumber;
  address: string;
};

export function MutlicallButton({
  nftsSelected,
  controller,
  debt,
  minOut,
  address,
}: MulticallButtonProps) {
  const multicallFunctionData = useMemo(() => {
    const contractsAndTokenIds = nftsSelected.map((id) =>
      deconstructFromId(id),
    );

    const addCollateralArgs: AddCollateralArgsStruct[] =
      contractsAndTokenIds.map(([contractAddress, tokenId]) => ({
        oracleInfo: getOraclePayloadFromReservoirObject(
          controller.oracleInfo[contractAddress],
        ),
        collateral: {
          addr: contractAddress,
          id: ethers.BigNumber.from(tokenId),
        },
      }));

    const paprControllerIFace = new ethers.utils.Interface(
      PaprControllerABI.abi,
    );

    const calldata = addCollateralArgs.map((args) =>
      paprControllerIFace.encodeFunctionData(AddCollateralEncoderString, [
        args.collateral,
        args.oracleInfo,
      ]),
    );
    const calldataWithSwap = [
      ...calldata,
      paprControllerIFace.encodeFunctionData(MintAndSwapEncoderString, [
        debt,
        minOut,
        ethers.BigNumber.from(0),
        address,
      ]),
    ];

    return calldataWithSwap;
  }, [nftsSelected, address, debt, minOut, controller]);

  const { config: multicallConfig } = usePrepareContractWrite({
    address: controller.id,
    abi: PaprControllerABI.abi,
    functionName: 'multicall',
    args: [multicallFunctionData as `0x${string}`[]],
    overrides,
  });
  const { data, write } = useContractWrite({
    ...multicallConfig,
    onSuccess: (data: any) => {
      data.wait().then(() => window.location.reload());
    },
  } as any);

  return (
    <TransactionButton
      onClick={write!}
      transactionData={data}
      text={'Borrow'}
    />
  );
}

type RepayButtonProps = {
  controller: PaprController;
  underlyingAmount: ethers.BigNumber;
  minOut: ethers.BigNumber;
  address: string;
};

export function RepayButton({
  controller,
  underlyingAmount,
  minOut,
  address,
}: RepayButtonProps) {
  const { config } = usePrepareContractWrite({
    address: controller.id,
    abi: PaprControllerABI.abi,
    functionName: 'buyAndReduceDebt',
    args: [
      address as `0x${string}`,
      underlyingAmount,
      minOut,
      ethers.BigNumber.from(0),
      address as `0x${string}`,
    ],
    overrides,
  });

  const { data, write } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      data.wait().then(() => window.location.reload());
    },
  } as any);

  return (
    <TransactionButton onClick={write!} transactionData={data} text={'Repay'} />
  );
}
