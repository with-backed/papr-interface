import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import {
  computeLiquidationEstimation,
  deconstructFromId,
} from 'lib/controllers';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  IPaprController,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/PaprController';
import {
  erc20ABI,
  erc721ABI,
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';
import styles from './OpenVault.module.css';
import VaultMath from './VaultMath';
import { ControllerPricesData } from 'lib/controllers/charts';
import { getAddress } from 'ethers/lib/utils';
import { CenterUserNFTsResponse } from 'hooks/useCenterNFTs';
import { PaprController } from 'lib/PaprController';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { VaultDebtSlider } from './VaultDebtSlider';
import { VaultsByOwnerForControllerQuery } from 'types/generated/graphql/inKindSubgraph';
import { Button, TransactionButton } from 'components/Button';
import { ERC721 } from 'types/generated/abis';
import {
  MintAndSellDebtButton,
  MutlicallButton,
  RepayButton,
  SafeTransferFromButton,
} from './OpenVaultButtons';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';

type BorrowProps = {
  controller: PaprController;
  userCollectionNFTs: CenterUserNFTsResponse[];
  nftsSelected: string[];
  currentVault: VaultsByOwnerForControllerQuery['vaults'][0] | null;
  pricesData: ControllerPricesData;
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

export function OpenVault({
  controller,
  nftsSelected,
  currentVault,
  pricesData,
}: BorrowProps) {
  const { address } = useAccount();

  const oracleInfo = useOracleInfo();
  const currentVaultDebt = useMemo(() => {
    return ethers.BigNumber.from(currentVault?.debt || 0);
  }, [currentVault]);
  const [chosenDebt, setChosenDebt] =
    useState<ethers.BigNumber>(currentVaultDebt);
  const [maxDebt, setMaxDebt] = useState<ethers.BigNumber | null>(null);
  const [isBorrowing, setIsBorrowing] = useState<boolean>(true);
  const [liquidationDateEstimation, setLiquidationDateEstimation] =
    useState<string>('');
  const [showMath, setShowMath] = useState<boolean>(false);
  const [underlyingApproved, setUnderlyingApproved] = useState<boolean>(false);
  const [allNFTsApproved, setAllNFTsApproved] = useState(false);

  const underlying = useMemo(() => {
    return controller.underlying;
  }, [controller]);

  const debtToken = useMemo(() => {
    return controller.debtToken;
  }, [controller]);

  const debtToBorrowOrRepay = useMemo(() => {
    if (currentVaultDebt.isZero()) return chosenDebt;
    if (chosenDebt.gt(currentVaultDebt))
      return chosenDebt.sub(currentVaultDebt);
    return currentVaultDebt.sub(chosenDebt);
  }, [chosenDebt, currentVaultDebt]);

  const { quoteForSwap, priceImpact } = useQuoteWithSlippage(
    controller,
    debtToBorrowOrRepay,
    true,
  );
  const formattedQuoteForSwap = useMemo(() => {
    if (!quoteForSwap) return '';
    return parseFloat(quoteForSwap).toFixed(4);
  }, [quoteForSwap]);

  const initializeUnderlyingApproved = useCallback(async () => {
    if (!address) {
      return;
    }
    const connectedToken = controller.token0IsUnderlying
      ? controller.token0
      : controller.token1;
    if (
      (await connectedToken.allowance(address, controller.id)) >
      ethers.BigNumber.from(0)
    ) {
      setUnderlyingApproved(true);
    }
  }, [controller, address]);

  const handleChosenDebtChanged = useCallback(
    async (value: string) => {
      if (!maxDebt) return;

      const debtBigNumber = ethers.utils.parseUnits(value, debtToken.decimals);
      setChosenDebt(debtBigNumber);

      if (value === '') {
        setLiquidationDateEstimation('');
        return;
      }

      setLiquidationDateEstimation(
        await (
          await computeLiquidationEstimation(debtBigNumber, maxDebt, controller)
        ).toFixed(0),
      );
    },
    [maxDebt, debtToken.decimals, controller],
  );

  const oracleValueOfCollateral = useMemo(() => {
    // TODO(adamgobes): for NFTs already in the vault, use contract frozen oracle value in case they've been updated by reservoir post lock-up
    return [
      ...nftsSelected.map((id) => deconstructFromId(id)[0]),
      ...(currentVault?.collateral || []).map(
        (c) => c.contractAddress as string,
      ),
    ]
      .map((address) => oracleInfo?.[getAddress(address)].price!)
      .reduce((a, b) => a + b, 0);
  }, [nftsSelected, currentVault, oracleInfo]);

  const getMaxDebt = useCallback(async () => {
    const maxDebt = ethers.BigNumber.from(0); // TODO(adamgobes): fix this once redo of OpenVault components is done

    setMaxDebt(maxDebt);
  }, []);

  const maxLTV = useAsyncValue(() => controller.maxLTVPercent(), [controller]);

  useEffect(() => {
    initializeUnderlyingApproved();
    getMaxDebt();
  }, [initializeUnderlyingApproved, getMaxDebt]);

  if (!maxDebt) return <></>;

  return (
    <Fieldset legend="🏦 Set Loan Amount">
      <div className={styles.borrowComponentWrapper}>
        <VaultDebtSlider
          controller={controller}
          currentVaultDebt={currentVaultDebt!}
          maxDebt={maxDebt}
          handleChosenDebtChanged={handleChosenDebtChanged}
          maxLTV={maxLTV}
          isBorrowing={isBorrowing}
          setIsBorrowing={setIsBorrowing}
        />
        <div className={`${styles.mathWrapper} ${styles.priceImpactWrapper}`}>
          <div className={`${styles.mathRow} ${styles.even}`}>
            <div>
              <p>Price Impact</p>
            </div>
            <div>
              <p>{priceImpact}%</p>
            </div>
          </div>
          <div className={styles.mathRow}>
            <div>
              <p>Estimated days before liquidation</p>
            </div>
            <div>
              <p>{liquidationDateEstimation}</p>
            </div>
          </div>
        </div>

        <div className={styles.borrowInput}>
          <div className={styles.underlyingInput}>
            <div>
              {isBorrowing ? '+' : '-'} {formattedQuoteForSwap}
            </div>
            <div>{underlying.symbol}</div>
          </div>

          {isBorrowing && (
            <Button
              size="small"
              kind="outline"
              onClick={() => setShowMath(true)}>
              Review Math
            </Button>
          )}

          {!isBorrowing && (
            <div className={styles['button-container']}>
              {!underlyingApproved && (
                <ApproveUnderlyingButton
                  controller={controller}
                  setUnderlyingApproved={setUnderlyingApproved}
                  underlyingApproved={underlyingApproved}
                />
              )}
              <RepayButton
                minOut={ethers.utils.parseUnits(
                  !!quoteForSwap ? quoteForSwap : '0',
                  controller.underlying.decimals,
                )}
                underlyingAmount={chosenDebt}
                controller={controller}
              />
            </div>
          )}
        </div>

        {isBorrowing && (
          <VaultMath
            controller={controller}
            pricesData={pricesData}
            inputtedLTV={
              maxDebt.isZero() || !maxLTV
                ? '0.00'
                : (
                    (parseFloat(chosenDebt.toString()) /
                      parseFloat(maxDebt.toString())) *
                    maxLTV
                  ).toFixed(2)
            }
            oracleValue={oracleValueOfCollateral.toFixed(2)}
            quoteForSwap={formattedQuoteForSwap}
            showMath={showMath}
          />
        )}
        {isBorrowing && (
          <div
            className={`${styles.approveAndBorrowButtons} ${
              !showMath && styles.noDisplay
            }`}>
            <div className={styles['button-container']}>
              <NFTApprovalButtons
                nftsSelected={nftsSelected}
                collateralContracts={controller.collateralContracts}
                controllerId={controller.id}
                setAllNFTsApproved={setAllNFTsApproved}
              />
              {nftsSelected.length === 0 && (
                <MintAndSellDebtButton
                  debt={debtToBorrowOrRepay}
                  minOut={ethers.utils.parseUnits(
                    !!quoteForSwap ? quoteForSwap : '0',
                    controller.underlying.decimals,
                  )}
                  controller={controller}
                />
              )}
              {nftsSelected.length === 1 && (
                <SafeTransferFromButton
                  collateralAddress={deconstructFromId(nftsSelected[0])[0]}
                  tokenId={deconstructFromId(nftsSelected[0])[1]}
                  debt={debtToBorrowOrRepay}
                  minOut={ethers.utils.parseUnits(
                    !!quoteForSwap ? quoteForSwap : '0',
                    controller.underlying.decimals,
                  )}
                  controller={controller}
                />
              )}
              {nftsSelected.length > 1 && (
                <MutlicallButton
                  nftsSelected={nftsSelected}
                  debt={debtToBorrowOrRepay}
                  minOut={ethers.utils.parseUnits(
                    !!quoteForSwap ? quoteForSwap : '0',
                    controller.underlying.decimals,
                  )}
                  controller={controller}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Fieldset>
  );
}

type NFTApprovalButtonsProps = {
  nftsSelected: string[];
  collateralContracts: ERC721[];
  controllerId: string;
  setAllNFTsApproved: (value: boolean) => void;
};
function NFTApprovalButtons({
  collateralContracts,
  nftsSelected,
  controllerId,
  setAllNFTsApproved,
}: NFTApprovalButtonsProps) {
  const { address } = useAccount();

  const uniqueContractAddresses = useMemo(() => {
    return Array.from(
      new Set(nftsSelected.map((id) => deconstructFromId(id)[0])),
    );
  }, [nftsSelected]);

  const contracts = useMemo(() => {
    return uniqueContractAddresses.map(
      (a) =>
        collateralContracts.find(
          (c) => getAddress(c.address) === getAddress(a),
        )!,
    );
  }, [collateralContracts, uniqueContractAddresses]);

  const [approvalStatuses, setApprovalStatuses] = useState(
    contracts.reduce<{ [key: string]: 'unknown' | true | false }>(
      (acc, curr) => {
        return { ...acc, [curr.address]: 'unknown' };
      },
      {},
    ),
  );

  const setApproved = useCallback((contractAddress: string) => {
    setApprovalStatuses((prev) => ({ ...prev, [contractAddress]: true }));
  }, []);

  useEffect(() => {
    if (address) {
      contracts.forEach((c) => {
        c.isApprovedForAll(address, controllerId).then((v) =>
          setApprovalStatuses((prev) => ({ ...prev, [c.address]: v })),
        );
      });
    }
  }, [address, contracts, controllerId]);

  useEffect(() => {
    if (Object.values(approvalStatuses).every((v) => v === true)) {
      setAllNFTsApproved(true);
    }
  }, [approvalStatuses, setAllNFTsApproved]);

  return (
    <>
      {contracts.map((c) => (
        <ApproveNFTButton
          key={c.address}
          collateralContract={c}
          controllerId={controllerId}
          approved={approvalStatuses[c.address]}
          setApproved={setApproved}
        />
      ))}
    </>
  );
}

type ApproveUnderlyingButtonProps = {
  controller: PaprController;
  setUnderlyingApproved: (val: boolean) => void;
  underlyingApproved: boolean;
};

export function ApproveUnderlyingButton({
  controller,
  setUnderlyingApproved,
  underlyingApproved,
}: ApproveUnderlyingButtonProps) {
  const underlying = useMemo(() => {
    return controller.token0IsUnderlying
      ? controller.token0
      : controller.token1;
  }, [controller]);
  const symbol = useAsyncValue(() => underlying.symbol(), [underlying]);
  const { config } = usePrepareContractWrite({
    address: underlying.address,
    abi: erc20ABI,
    functionName: 'approve',
    args: [controller.id as `0x${string}`, ethers.constants.MaxInt256],
  });
  const { data, write } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      data.wait().then(() => setUnderlyingApproved(true));
    },
  });

  return (
    <TransactionButton
      onClick={write!}
      transactionData={data}
      text={`Approve ${symbol}`}
      completed={underlyingApproved}
    />
  );
}

type ApproveNFTButtonProps = {
  collateralContract: ERC721;
  controllerId: string;
  approved: 'unknown' | true | false;
  setApproved: (contractAddress: string) => void;
};

function ApproveNFTButton({
  collateralContract,
  controllerId,
  approved,
  setApproved,
}: ApproveNFTButtonProps) {
  const name = useAsyncValue(
    () => collateralContract.name(),
    [collateralContract],
  );
  const { config } = usePrepareContractWrite({
    address: collateralContract.address,
    abi: erc721ABI,
    functionName: 'setApprovalForAll',
    args: [controllerId as `0x${string}`, true],
  });
  const { data, write } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      data.wait().then(() => setApproved(collateralContract.address));
    },
  });

  return (
    <TransactionButton
      onClick={write!}
      transactionData={data}
      text={name ? `Approve ${name}` : '...'}
      completed={approved === true}
    />
  );
}
