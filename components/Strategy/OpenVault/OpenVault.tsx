import { TickMath } from '@uniswap/v3-sdk';
import { Fieldset } from 'components/Fieldset';
import { Slider } from 'components/Slider';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import {
  LendingStrategy,
  computeLiquidationEstimation,
  deconstructFromId,
  getUniqueNFTId,
} from 'lib/strategies';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { PRICE } from 'lib/strategies/constants';
import LendingStrategyABI from 'abis/Strategy.json';
import { ILendingStrategy } from 'types/generated/abis/Strategy';
import { useAccount, useSigner } from 'wagmi';
import styles from './OpenVault.module.css';
import VaultMath from './VaultMath';
import { StrategyPricesData } from 'lib/strategies/charts';
import { getNextVaultNonceForUser } from 'lib/pAPRSubgraph';
import { erc721Contract } from 'lib/contracts';
import { getAddress } from 'ethers/lib/utils';
import { ERC721__factory } from 'types/generated/abis';

type BorrowProps = {
  strategy: LendingStrategy;
  nftsSelected: string[];
  pricesData: StrategyPricesData;
};

const AddCollateralEncoderString =
  'addCollateral(uint256 vaultNonce, tuple(address addr, uint256 id) collateral, tuple(uint128 price, uint8 period) oracleInfo, tuple(uint8 v, bytes32 r, bytes32 s) sig)';

interface AddCollateralArgsStruct {
  vaultNonce: ethers.BigNumber;
  collateral: ILendingStrategy.CollateralStruct;
  oracleInfo: ILendingStrategy.OracleInfoStruct;
  sig: ILendingStrategy.SigStruct;
}

const MintAndSwapEncoderString =
  'mintAndSellDebt(uint256 vaultNonce, int256 debt, uint256 minOut, uint160 sqrtPriceLimitX96, address proceedsTo)';

interface MintAndSwapArgsStruct {
  vaultNonce: ethers.BigNumber;
  debt: ethers.BigNumber;
  minOut: ethers.BigNumber;
  sqrtPriceLimitX96: ethers.BigNumber;
  proceedsTo: string;
}

const OnERC721ReceivedArgsEncoderString =
  'tuple(uint256 vaultNonce, address mintVaultTo, address mintDebtOrProceedsTo, uint256 minOut, int256 debt, uint160 sqrtPriceLimitX96, tuple(uint128 price, uint8 period) oracleInfo, tuple(uint8 v, bytes32 r, bytes32 s) sig)';

interface OnERC721ReceivedArgsStruct {
  vaultNonce: ethers.BigNumber;
  mintVaultTo: string;
  mintDebtOrProceedsTo: string;
  minOut: ethers.BigNumber;
  debt: ethers.BigNumber;
  sqrtPriceLimitX96: ethers.BigNumber;
  oracleInfo: ILendingStrategy.OracleInfoStruct;
  sig: ILendingStrategy.SigStruct;
}

const debounce = (func: any, wait: number) => {
  let timeout: any;

  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export function OpenVault({ strategy, nftsSelected, pricesData }: BorrowProps) {
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const [debt, setDebt] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [maxDebt, setMaxDebt] = useState<ethers.BigNumber>(
    ethers.BigNumber.from(0),
  );

  const [liquidationDateEstimation, setLiquidationDateEstimation] =
    useState<string>('');
  const {
    quoteForSwap,
    priceImpact,
    tokenOut,
    quoteLoading,
    priceImpactLoading,
  } = useQuoteWithSlippage(strategy, debt.toString(), true);
  const [showMath, setShowMath] = useState<boolean>(false);
  const [nftsApproved, setNFTsApproved] = useState<string[]>([]);

  const collateralContract = useMemo(() => {
    return erc721Contract(strategy.collateral.contract.address, signer!);
  }, [strategy, signer]);

  const addCollateralAndSwap = useCallback(async () => {
    const tokenIds = nftsSelected.map((id) => deconstructFromId(id)[1]);

    const nextNonce = await getNextVaultNonceForUser(strategy, address!);
    const vaultNonce = ethers.BigNumber.from(nextNonce);
    const minOut = ethers.utils.parseUnits(quoteForSwap, tokenOut.decimals);
    const sqrtPriceLimitX96 = strategy.token0IsUnderlying
      ? ethers.BigNumber.from(TickMath.MAX_SQRT_RATIO.toString()).sub(1)
      : ethers.BigNumber.from(TickMath.MIN_SQRT_RATIO.toString()).add(1);
    const debtForArgs = ethers.utils.parseUnits(
      debt.toString(),
      strategy.underlying.decimals,
    );
    const oracleInfo = {
      price: ethers.utils.parseUnits(PRICE.toString(), 18),
      period: ethers.BigNumber.from(0),
    };
    const sig = {
      v: ethers.BigNumber.from(1),
      r: ethers.utils.formatBytes32String('x'),
      s: ethers.utils.formatBytes32String('y'),
    };

    if (tokenIds.length === 1) {
      const erc721ReceivedArgs: OnERC721ReceivedArgsStruct = {
        debt: debtForArgs,
        vaultNonce,
        minOut,
        sqrtPriceLimitX96,
        mintDebtOrProceedsTo: address!,
        mintVaultTo: address!,
        oracleInfo,
        sig,
      };

      await collateralContract[
        'safeTransferFrom(address,address,uint256,bytes)'
      ](
        address!,
        strategy.contract.address,
        ethers.BigNumber.from(tokenIds[0]),
        ethers.utils.defaultAbiCoder.encode(
          [OnERC721ReceivedArgsEncoderString],
          [erc721ReceivedArgs],
        ),
        {
          gasLimit: ethers.utils.hexValue(3000000),
        },
      );
    } else {
      const baseAddCollateralRequest: Partial<AddCollateralArgsStruct> = {
        vaultNonce: ethers.BigNumber.from(nextNonce),
        oracleInfo,
        sig,
      };

      const addCollateralArgs = tokenIds.map((tokenId) => ({
        ...baseAddCollateralRequest,
        collateral: {
          addr: strategy.collateral.contract.address,
          id: ethers.BigNumber.from(tokenId),
        },
      }));

      const lendingStrategyIFace = new ethers.utils.Interface(
        LendingStrategyABI.abi,
      );

      const calldata = addCollateralArgs.map((args) =>
        lendingStrategyIFace.encodeFunctionData(AddCollateralEncoderString, [
          args.vaultNonce,
          args.collateral,
          args.oracleInfo,
          args.sig,
        ]),
      );

      const mintAndSellDebtArgs: MintAndSwapArgsStruct = {
        vaultNonce,
        debt: debtForArgs,
        minOut,
        sqrtPriceLimitX96,
        proceedsTo: address!,
      };

      const calldataWithSwap = [
        ...calldata,
        lendingStrategyIFace.encodeFunctionData(MintAndSwapEncoderString, [
          mintAndSellDebtArgs.vaultNonce,
          mintAndSellDebtArgs.debt,
          mintAndSellDebtArgs.minOut,
          mintAndSellDebtArgs.sqrtPriceLimitX96,
          mintAndSellDebtArgs.proceedsTo,
        ]),
      ];

      const t = await strategy.contract
        .connect(signer!)
        .multicall(calldataWithSwap, {
          gasLimit: ethers.utils.hexValue(3000000),
        });
      t.wait()
        .then(() => console.log('success')) // TODO(adamgobes): redirect to vault page once thats fleshed out
        .catch((e) => console.log({ e }));
    }
  }, [
    address,
    collateralContract,
    nftsSelected,
    debt,
    signer,
    strategy,
    quoteForSwap,
    tokenOut.decimals,
  ]);

  // TODO: I think useCallback may not be able to introspect the debounced
  // function this produces. May need to either manually handle debounce with
  // timeouts or do something else.
  const handleDebtAmountChanged = debounce(async (value: string) => {
    setDebt(ethers.BigNumber.from(value));

    if (value === '') {
      setLiquidationDateEstimation('');
      return;
    }

    setLiquidationDateEstimation(
      await (
        await computeLiquidationEstimation(
          ethers.BigNumber.from(value),
          maxDebt,
          strategy,
        )
      ).toFixed(0),
    );
  }, 500);

  const getMaxDebt = useCallback(async () => {
    const newNorm = await strategy.contract.newNorm();
    const maxLTV = await strategy.contract.maxLTV();

    const maxDebt = maxLTV
      .mul(ethers.BigNumber.from(PRICE))
      .div(newNorm)
      .mul(ethers.BigNumber.from(nftsSelected.length));

    setMaxDebt(maxDebt);
  }, [strategy, nftsSelected]);

  const maxLTV = useMemo(() => {
    return strategy.maxLTVPercent;
  }, [strategy]);

  const isNFTApproved = useCallback(
    async (tokenId: string) => {
      const approved =
        getAddress(await collateralContract.getApproved(tokenId)) ===
          getAddress(strategy.contract.address) ||
        (await collateralContract.isApprovedForAll(
          address!,
          strategy.contract.address,
        ));
      return approved;
    },
    [strategy, collateralContract, address],
  );

  const initializeNFTsApproved = useCallback(async () => {
    const nftApprovals = await Promise.all(
      nftsSelected.map(async (id) => {
        const [address, tokenId] = deconstructFromId(id);
        return (await isNFTApproved(tokenId))
          ? getUniqueNFTId(address, tokenId)
          : '';
      }),
    );
    setNFTsApproved(nftApprovals.filter((id) => !!id));
  }, [isNFTApproved, nftsSelected]);

  useEffect(() => {
    initializeNFTsApproved();
    getMaxDebt();
  }, [initializeNFTsApproved, getMaxDebt]);

  const performApproveAll = useCallback(async () => {
    await collateralContract
      .setApprovalForAll(strategy.contract.address, true)
      .then(() => {});
  }, [collateralContract, strategy]);

  const approveDisabled = useMemo(() => {
    return (
      nftsSelected.sort() !== nftsApproved.sort() || nftsSelected.length === 0
    );
  }, [nftsSelected, nftsApproved]);

  const borrowDisabled = useMemo(() => {
    return (
      nftsSelected.sort() === nftsApproved.sort() || nftsSelected.length === 0
    );
  }, [nftsSelected, nftsApproved]);

  return (
    <Fieldset legend="🏦 Set Loan Amount">
      <div className={styles.borrowComponentWrapper}>
        <div className={styles.sliderWrapper}>
          <Slider
            min={0}
            max={parseFloat(maxDebt.toString())}
            onChange={(val, _index) => handleDebtAmountChanged(val.toString())}
            renderThumb={(props, state) => {
              let currentLTV: number;
              if (maxDebt.isZero()) {
                currentLTV = 0;
              } else {
                currentLTV =
                  (state.valueNow / parseFloat(maxDebt.toString())) * maxLTV;
              }

              let pushedClassName: string;
              if (currentLTV < 5) {
                pushedClassName = styles.sliderLabelPushedRight;
              } else if (currentLTV > maxLTV - 5) {
                pushedClassName = styles.sliderLabelPushedLeft;
              } else {
                pushedClassName = '';
              }

              return (
                <div {...props}>
                  <div className={`${styles.sliderLabel} ${pushedClassName}`}>
                    <p>Loan Amount</p>
                    <p>{currentLTV.toFixed(2)}% LTV</p>
                  </div>
                </div>
              );
            }}
          />
          <p className={styles.sliderLabel}>
            Max Loan {maxLTV.toString()}% LTV
          </p>
        </div>

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
            <div>{quoteForSwap}</div>
            <div>{tokenOut.symbol}</div>
          </div>
          <div
            className={styles.showMath}
            onClick={() => setShowMath(!showMath)}>
            Show Math
          </div>

          <div
            className={`${styles.button} ${styles.reviewButton}`}
            onClick={() => setShowMath(true)}>
            Review
          </div>
        </div>

        <VaultMath
          strategy={strategy}
          pricesData={pricesData}
          inputtedLTV={
            maxDebt.isZero()
              ? '0.00'
              : (
                  (parseFloat(debt.toString()) /
                    parseFloat(maxDebt.toString())) *
                  maxLTV
                ).toFixed(2)
          }
          quoteForSwap={quoteForSwap}
          showMath={showMath}
        />
        <div
          className={`${styles.approveAndBorrowButtons} ${
            !showMath && styles.noDisplay
          }`}>
          <button
            className={styles.button}
            onClick={performApproveAll}
            disabled={approveDisabled}>
            Approve NFTS
          </button>
          <button
            className={styles.button}
            onClick={addCollateralAndSwap}
            disabled={borrowDisabled}>
            Borrow
          </button>
        </div>
      </div>
    </Fieldset>
  );
}
