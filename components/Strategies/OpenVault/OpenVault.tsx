import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import {
  computeLiquidationEstimation,
  deconstructFromId,
  getUniqueNFTId,
} from 'lib/strategies';
import { useCallback, useEffect, useState, useMemo } from 'react';
import LendingStrategyABI from 'abis/Strategy.json';
import {
  ILendingStrategy,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/Strategy';
import { useAccount } from 'wagmi';
import styles from './OpenVault.module.css';
import VaultMath from './VaultMath';
import { StrategyPricesData } from 'lib/strategies/charts';
import { getAddress } from 'ethers/lib/utils';
import { CenterUserNFTsResponse } from 'hooks/useCenterNFTs';
import { LendingStrategy } from 'lib/LendingStrategy';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { VaultDebtSlider } from './VaultDebtSlider';
import { VaultsByOwnerForStrategyQuery } from 'types/generated/graphql/inKindSubgraph';
import {
  getOraclePayloadFromReservoirObject,
  ReservoirResponseData,
} from 'lib/oracle/reservoir';

type BorrowProps = {
  strategy: LendingStrategy;
  userCollectionNFTs: CenterUserNFTsResponse[];
  oracleInfo: { [key: string]: ReservoirResponseData };
  nftsSelected: string[];
  currentVault: VaultsByOwnerForStrategyQuery['vaults'][0] | null;
  pricesData: StrategyPricesData;
};

const AddCollateralEncoderString =
  'addCollateral(tuple(address addr, uint256 id) collateral, tuple(uint128 price, uint8 period) oracleInfo, tuple(uint8 v, bytes32 r, bytes32 s) sig)';

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
  userCollectionNFTs,
  nftsSelected,
  oracleInfo,
  currentVault,
  pricesData,
}: BorrowProps) {
  const { address } = useAccount();

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
  const [nftsApproved, setNFTsApproved] = useState<string[]>([]);
  const [underlyingApproved, setUnderlyingApproved] = useState<boolean>(false);
  const [approvalsLoading, setApprovalsLoading] = useState<boolean>(false);

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

  const borrowMore = useCallback(async () => {
    const contractsAndTokenIds = nftsSelected.map((id) =>
      deconstructFromId(id),
    );

    const minOut = ethers.utils.parseUnits(
      quoteForSwap,
      strategy.underlying.decimals,
    );

    const mintAndSellDebtArgs: MintAndSwapArgsStruct = {
      debt: debtToBorrowOrRepay,
      minOut,
      sqrtPriceLimitX96: ethers.BigNumber.from(0),
      proceedsTo: address!,
    };

    if (contractsAndTokenIds.length === 0) {
      await strategy.mintAndSellDebt(
        mintAndSellDebtArgs.debt,
        mintAndSellDebtArgs.minOut,
        mintAndSellDebtArgs.sqrtPriceLimitX96,
        mintAndSellDebtArgs.proceedsTo,
        {
          gasLimit: ethers.utils.hexValue(3000000),
        },
      );
    } else if (contractsAndTokenIds.length === 1) {
      const [contractAddress, tokenId] = contractsAndTokenIds[0];

      const erc721ReceivedArgs: OnERC721ReceivedArgsStruct = {
        debt: debtToBorrowOrRepay,
        minOut,
        sqrtPriceLimitX96: ethers.BigNumber.from(0),
        mintDebtOrProceedsTo: address!,
        oracleInfo: await getOraclePayloadFromReservoirObject(
          oracleInfo[contractAddress],
        ),
      };

      const collateralContract = strategy.collateralContracts.find(
        (c) => getAddress(c.address) === getAddress(contractAddress),
      )!;

      await collateralContract[
        'safeTransferFrom(address,address,uint256,bytes)'
      ](
        address!,
        strategy.id,
        ethers.BigNumber.from(tokenId),
        ethers.utils.defaultAbiCoder.encode(
          [OnERC721ReceivedArgsEncoderString],
          [erc721ReceivedArgs],
        ),
        {
          gasLimit: ethers.utils.hexValue(3000000),
        },
      );
    } else {
      const addCollateralArgs: AddCollateralArgsStruct[] = await Promise.all(
        contractsAndTokenIds.map(async ([contractAddress, tokenId]) => ({
          oracleInfo: await getOraclePayloadFromReservoirObject(
            oracleInfo[contractAddress],
          ),
          collateral: {
            addr: contractAddress,
            id: ethers.BigNumber.from(tokenId),
          },
        })),
      );

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
          mintAndSellDebtArgs.debt,
          mintAndSellDebtArgs.minOut,
          mintAndSellDebtArgs.sqrtPriceLimitX96,
          mintAndSellDebtArgs.proceedsTo,
        ]),
      ];

      const t = await strategy.multicall(calldataWithSwap, {
        gasLimit: ethers.utils.hexValue(3000000),
      });
      t.wait()
        .then(() => console.log('success')) // TODO(adamgobes): redirect to vault page once thats fleshed out
        .catch((e) => console.log({ e }));
    }
  }, [
    address,
    nftsSelected,
    debtToBorrowOrRepay,
    strategy,
    quoteForSwap,
    oracleInfo,
  ]);

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
    const newNorm = await strategy.newNorm();
    const maxLTV = await strategy.maxLTV();

    const totalNFTsInVault = !currentVault ? 0 : currentVault.collateral.length;

    const maxDebt = maxLTV
      .mul(
        ethers.utils.parseUnits(
          oracleValueOfCollateral.toString(),
          underlying.decimals,
        ),
      )
      .div(newNorm)
      .mul(ethers.BigNumber.from(nftsSelected.length + totalNFTsInVault));

    setMaxDebt(maxDebt);
  }, [
    strategy,
    nftsSelected,
    oracleValueOfCollateral,
    currentVault,
    underlying.decimals,
  ]);

  const maxLTV = useAsyncValue(() => strategy.maxLTVPercent(), [strategy]);

  const isNFTApproved = useCallback(
    async (contractAddress: string, tokenId: string) => {
      const collateralContract = strategy.collateralContracts.find(
        (c) => getAddress(c.address) === getAddress(contractAddress),
      )!;
      const approved =
        getAddress(await collateralContract.getApproved(tokenId)) ===
          getAddress(strategy.id) ||
        (await collateralContract.isApprovedForAll(address!, strategy.id));
      return approved;
    },
    [strategy, address],
  );

  const initializeNFTsApproved = useCallback(async () => {
    const nftApprovals = await Promise.all(
      userCollectionNFTs.map(async (nft) => {
        return (await isNFTApproved(nft.address, nft.tokenId))
          ? getUniqueNFTId(nft.address, nft.tokenId)
          : '';
      }),
    );
    setNFTsApproved(nftApprovals.filter((id) => !!id));
  }, [isNFTApproved, userCollectionNFTs]);

  useEffect(() => {
    initializeNFTsApproved();
    initializeUnderlyingApproved();
    getMaxDebt();
  }, [initializeNFTsApproved, initializeUnderlyingApproved, getMaxDebt]);

  const performApproveAll = useCallback(async () => {
    setApprovalsLoading(true);
    await Promise.all(
      nftsSelected.map(async (id) => {
        const [contractAddress, _tokenId] = deconstructFromId(id);
        const collateralContract = strategy.collateralContracts.find(
          (c) => getAddress(c.address) === getAddress(contractAddress),
        )!;
        return collateralContract.setApprovalForAll(strategy.id, true);
      }),
    );
    setNFTsApproved((prevNFTsApproved) => [
      ...prevNFTsApproved,
      ...nftsSelected,
    ]);
    setApprovalsLoading(false);
  }, [nftsSelected, strategy]);

  const borrowDisabled = useMemo(() => {
    if (!!currentVault && nftsSelected.length === 0) return false;
    const allSelectedAreApproved =
      nftsSelected.filter((val) => nftsApproved.includes(val)).length ===
      nftsSelected.length;
    return (
      (!allSelectedAreApproved && nftsSelected.length !== 1) ||
      nftsSelected.length === 0
    );
  }, [nftsSelected, nftsApproved, currentVault]);

  const approveDisabled = useMemo(() => {
    return !borrowDisabled || nftsSelected.length < 2;
  }, [nftsSelected, borrowDisabled]);

  if (!maxDebt) return <></>;

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
              className={styles.showMath}
              onClick={() => setShowMath(!showMath)}>
              Show Math
            </div>
          )}

          {isBorrowing && (
            <div
              className={`${styles.button} ${styles.reviewButton}`}
              onClick={() => setShowMath(true)}>
              Review
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
            {!approveDisabled && (
              <button className={styles.button} onClick={performApproveAll}>
                {approvalsLoading && '...'}
                {!approvalsLoading && 'Approve NFTs'}
              </button>
            )}
            <button
              className={styles.button}
              onClick={borrowMore}
              disabled={borrowDisabled}>
              Borrow
            </button>
          </div>
        )}
      </div>
    </Fieldset>
  );
}
