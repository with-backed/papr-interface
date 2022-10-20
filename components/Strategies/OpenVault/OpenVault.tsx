import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import {
  computeLiquidationEstimation,
  deconstructFromId,
} from 'lib/strategies';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ILendingStrategy,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/Strategy';
import {
  erc721ABI,
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';
import styles from './OpenVault.module.css';
import VaultMath from './VaultMath';
import { StrategyPricesData } from 'lib/strategies/charts';
import { getAddress } from 'ethers/lib/utils';
import { CenterUserNFTsResponse } from 'hooks/useCenterNFTs';
import { LendingStrategy } from 'lib/LendingStrategy';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { VaultDebtSlider } from './VaultDebtSlider';
import { VaultsByOwnerForStrategyQuery } from 'types/generated/graphql/inKindSubgraph';
import { Button, TransactionButton } from 'components/Button';
import { ERC721 } from 'types/generated/abis';
import {
  MintAndSellDebtButton,
  MutlicallButton,
  SafeTransferFromButton,
} from './OpenVaultButtons';

type BorrowProps = {
  strategy: LendingStrategy;
  userCollectionNFTs: CenterUserNFTsResponse[];
  nftsSelected: string[];
  currentVault: VaultsByOwnerForStrategyQuery['vaults'][0] | null;
  pricesData: StrategyPricesData;
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

export function OpenVault({
  strategy,
  nftsSelected,
  currentVault,
  pricesData,
}: BorrowProps) {
  const { address } = useAccount();

  const oracleInfo = useMemo(() => {
    return strategy.oracleInfo;
  }, [strategy]);
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
    return strategy.underlying;
  }, [strategy]);

  const debtToken = useMemo(() => {
    return strategy.debtToken;
  }, [strategy]);

  const debtToBorrowOrRepay = useMemo(() => {
    if (currentVaultDebt.isZero()) return chosenDebt;
    if (chosenDebt.gt(currentVaultDebt))
      return chosenDebt.sub(currentVaultDebt);
    return currentVaultDebt.sub(chosenDebt);
  }, [chosenDebt, currentVaultDebt]);

  const { quoteForSwap, priceImpact } = useQuoteWithSlippage(
    strategy,
    debtToBorrowOrRepay,
    true,
  );
  const formattedQuoteForSwap = useMemo(() => {
    if (!quoteForSwap) return '';
    return parseFloat(quoteForSwap).toFixed(4);
  }, [quoteForSwap]);

  const initializeUnderlyingApproved = useCallback(async () => {
    const connectedToken = strategy.token0IsUnderlying
      ? strategy.token0
      : strategy.token1;
    if (
      (await connectedToken.allowance(address!, strategy.id)) >
      ethers.BigNumber.from(0)
    ) {
      setUnderlyingApproved(true);
    }
  }, [strategy, address]);

  const approveUnderlying = useCallback(async () => {
    const connectedToken = strategy.token0IsUnderlying
      ? strategy.token0
      : strategy.token1;
    connectedToken
      .approve(strategy.id, ethers.constants.MaxInt256)
      .then(() => setUnderlyingApproved(true));
  }, [strategy]);

  const repay = useCallback(async () => {
    if (!currentVault) return;

    await strategy.buyAndReduceDebt(
      currentVault.id,
      ethers.utils.parseUnits(quoteForSwap, strategy.underlying.decimals),
      chosenDebt,
      ethers.BigNumber.from(0),
      address!,
      {
        gasLimit: ethers.utils.hexValue(3000000),
      },
    );
  }, [currentVault, strategy, address, chosenDebt, quoteForSwap]);

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
          await computeLiquidationEstimation(debtBigNumber, maxDebt, strategy)
        ).toFixed(0),
      );
    },
    [maxDebt, debtToken.decimals, strategy],
  );

  const oracleValueOfCollateral = useMemo(() => {
    // TODO(adamgobes): for NFTs already in the vault, use contract frozen oracle value in case they've been updated by reservoir post lock-up
    return [
      ...nftsSelected.map((id) => deconstructFromId(id)[0]),
      ...(currentVault?.collateral || []).map(
        (c) => c.contractAddress as string,
      ),
    ]
      .map((address) => oracleInfo[getAddress(address)].price)
      .reduce((a, b) => a + b, 0);
  }, [nftsSelected, currentVault, oracleInfo]);

  const getMaxDebt = useCallback(async () => {
    const maxDebt = await strategy.maxDebt(
      address!,
      ethers.utils.parseUnits(
        oracleValueOfCollateral.toString(),
        underlying.decimals,
      ),
    );

    setMaxDebt(maxDebt);
  }, [strategy, address, oracleValueOfCollateral, underlying.decimals]);

  const maxLTV = useAsyncValue(() => strategy.maxLTVPercent(), [strategy]);

  useEffect(() => {
    initializeUnderlyingApproved();
    getMaxDebt();
  }, [initializeUnderlyingApproved, getMaxDebt]);

  const borrowDisabled = useMemo(() => {
    if (!!currentVault && nftsSelected.length === 0) return false;
    return (
      (!allNFTsApproved && nftsSelected.length !== 1) ||
      nftsSelected.length === 0
    );
  }, [nftsSelected, allNFTsApproved, currentVault]);

  if (!maxDebt) return <></>;

  console.log({
    maxDebt: maxDebt?.toString(),
    maxLTV,
    chosenDebt: chosenDebt.toString(),
    result:
      maxDebt.isZero() || !maxLTV
        ? '0.00'
        : (
            parseFloat(chosenDebt.toString()) / parseFloat(maxDebt.toString())
          ).toFixed(2),
  });

  return (
    <Fieldset legend="🏦 Set Loan Amount">
      <div className={styles.borrowComponentWrapper}>
        <VaultDebtSlider
          strategy={strategy}
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
            <div
              className={`${styles.button} ${styles.reviewButton}`}
              onClick={() => setShowMath(true)}>
              Review Math
            </div>
          )}

          {!isBorrowing && (
            <div className={styles.approveAndBorrowButtons}>
              {!underlyingApproved && (
                <button className={styles.button} onClick={approveUnderlying}>
                  Approve {strategy.underlying.symbol}
                </button>
              )}
              <button className={styles.button} onClick={repay}>
                Repay
              </button>
            </div>
          )}
        </div>

        {isBorrowing && (
          <VaultMath
            strategy={strategy}
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
                collateralContracts={strategy.collateralContracts}
                strategyId={strategy.id}
                setAllNFTsApproved={setAllNFTsApproved}
              />
              {nftsSelected.length === 0 && (
                <MintAndSellDebtButton
                  address={address!}
                  debt={debtToBorrowOrRepay}
                  minOut={ethers.utils.parseUnits(
                    !!quoteForSwap ? quoteForSwap : '0',
                    strategy.underlying.decimals,
                  )}
                  strategy={strategy}
                />
              )}
              {nftsSelected.length === 1 && (
                <SafeTransferFromButton
                  collateralAddress={deconstructFromId(nftsSelected[0])[0]}
                  tokenId={deconstructFromId(nftsSelected[0])[1]}
                  address={address!}
                  debt={debtToBorrowOrRepay}
                  minOut={ethers.utils.parseUnits(
                    !!quoteForSwap ? quoteForSwap : '0',
                    strategy.underlying.decimals,
                  )}
                  strategy={strategy}
                />
              )}
              {nftsSelected.length > 1 && (
                <MutlicallButton
                  nftsSelected={nftsSelected}
                  address={address!}
                  debt={debtToBorrowOrRepay}
                  minOut={ethers.utils.parseUnits(
                    !!quoteForSwap ? quoteForSwap : '0',
                    strategy.underlying.decimals,
                  )}
                  strategy={strategy}
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
  strategyId: string;
  setAllNFTsApproved: (value: boolean) => void;
};
function NFTApprovalButtons({
  collateralContracts,
  nftsSelected,
  strategyId,
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
        c.isApprovedForAll(address, strategyId).then((v) =>
          setApprovalStatuses((prev) => ({ ...prev, [c.address]: v })),
        );
      });
    }
  }, [address, contracts, strategyId]);

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
          strategyId={strategyId}
          approved={approvalStatuses[c.address]}
          setApproved={setApproved}
        />
      ))}
    </>
  );
}

type ApproveNFTButtonProps = {
  collateralContract: ERC721;
  strategyId: string;
  approved: 'unknown' | true | false;
  setApproved: (contractAddress: string) => void;
};

function ApproveNFTButton({
  collateralContract,
  strategyId,
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
    args: [strategyId as `0x${string}`, true],
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
