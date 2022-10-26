import { TransactionButton } from 'components/Button';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { LendingStrategy } from 'lib/LendingStrategy';
import { getOraclePayloadFromReservoirObject } from 'lib/oracle/reservoir';
import { erc721ABI, useContractWrite, usePrepareContractWrite } from 'wagmi';
import LendingStrategyABI from 'abis/Strategy.json';
import ERC721ABI from 'abis/ERC721.json';
import {
  ILendingStrategy,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/Strategy';
import { useMemo } from 'react';
import { deconstructFromId } from 'lib/strategies';

type SafeTransferFromButtonProps = {
  strategy: LendingStrategy;
  collateralAddress: string;
  tokenId: string;
  debt: ethers.BigNumber;
  minOut: ethers.BigNumber;
  address: string;
};

const overrides = {
  gasLimit: ethers.utils.hexValue(3000000),
};

const AddCollateralEncoderString =
  'addCollateral(tuple(address addr, uint256 id) collateral, tuple(tuple(bytes32 id, bytes payload, uint256 timestamp, bytes signature) message, tuple(uint8 v, bytes32 r, bytes32 s) sig) oracleInfo)';

interface AddCollateralArgsStruct {
  collateral: ILendingStrategy.CollateralStruct;
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
  strategy,
  collateralAddress,
  tokenId,
  debt,
  minOut,
  address,
}: SafeTransferFromButtonProps) {
  const { data, write } = useContractWrite({
    mode: 'recklesslyUnprepared',
    addressOrName: getAddress(collateralAddress),
    contractInterface: erc721ABI,
    functionName: 'safeTransferFrom',
    args: [
      address,
      strategy.id,
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
              strategy.oracleInfo[getAddress(collateralAddress)],
            ),
          },
        ],
      ),
    ],
    onSuccess: (data) => {
      data.wait().then(() => console.log('safe transfer done'));
    },
    overrides,
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
  strategy: LendingStrategy;
  debt: ethers.BigNumber;
  minOut: ethers.BigNumber;
  address: string;
};

export function MintAndSellDebtButton({
  strategy,
  debt,
  minOut,
  address,
}: MintAndSellDebtButtonProps) {
  const { config: mintAndSellDebtConfig } = usePrepareContractWrite({
    addressOrName: strategy.id,
    contractInterface: LendingStrategyABI.abi,
    functionName: 'mintAndSellDebt',
    args: [debt, minOut, ethers.BigNumber.from(0), address],
    overrides,
  });
  const { data, write } = useContractWrite({
    ...mintAndSellDebtConfig,
    onSuccess: (data) => {
      data.wait().then(() => console.log('mint and sell debt done'));
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

type MulticallButtonProps = {
  nftsSelected: string[];
  strategy: LendingStrategy;
  debt: ethers.BigNumber;
  minOut: ethers.BigNumber;
  address: string;
};

export function MutlicallButton({
  nftsSelected,
  strategy,
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
          strategy.oracleInfo[contractAddress],
        ),
        collateral: {
          addr: contractAddress,
          id: ethers.BigNumber.from(tokenId),
        },
      }));

    const lendingStrategyIFace = new ethers.utils.Interface(
      LendingStrategyABI.abi,
    );

    const calldata = addCollateralArgs.map((args) =>
      lendingStrategyIFace.encodeFunctionData(AddCollateralEncoderString, [
        args.collateral,
        args.oracleInfo,
      ]),
    );
    const calldataWithSwap = [
      ...calldata,
      lendingStrategyIFace.encodeFunctionData(MintAndSwapEncoderString, [
        debt,
        minOut,
        ethers.BigNumber.from(0),
        address,
      ]),
    ];

    return calldataWithSwap;
  }, [nftsSelected, address, debt, minOut, strategy]);

  const { config: multicallConfig } = usePrepareContractWrite({
    addressOrName: strategy.id,
    contractInterface: LendingStrategyABI.abi,
    functionName: 'multicall',
    args: [multicallFunctionData],
    overrides,
  });
  const { data, write } = useContractWrite({
    ...multicallConfig,
    onSuccess: (data) => {
      data.wait().then(() => console.log('multicall done'));
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
