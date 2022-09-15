import { TickMath } from '@uniswap/v3-sdk';
import { Fieldset } from 'components/Fieldset';
import { Slider } from 'components/Slider';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import { LendingStrategy, computeLiquidationEstimation } from 'lib/strategies';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { PRICE } from 'lib/strategies/constants';
import LendingStrategyABI from 'abis/Strategy.json';
import { ILendingStrategy } from 'types/generated/abis/Strategy';
import { useAccount, useSigner } from 'wagmi';
import styles from './OpenVault.module.css';
import VaultMath from './VaultMath';
import { StrategyPricesData } from 'lib/strategies/charts';
import { deconstructFromId } from '../AccountNFTs/AccountNFTs';
import { getNextVaultNonceForUser } from 'lib/pAPRSubgraph';

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

export default function OpenVault({
  strategy,
  nftsSelected,
  pricesData,
}: BorrowProps) {
  const { address } = useAccount();
  const { data: signer } = useSigner();
  // TODO: looks like we're doing a lot of parsing on these values -- probably
  // makes sense to store them as numbers or BigNumbers and only format as
  // string when they're rendered.
  const [debt, setDebt] = useState<string>('');
  // TODO: this one in particular parses as NaN before being fed into Slider,
  // producing an error in the console.
  const [maxDebt, setMaxDebt] = useState<string>('');
  const [collateralTokenId, setCollateralTokenId] = useState<string>('1');
  const [liquidationDateEstimation, setLiquidationDateEstimation] =
    useState<string>('');
  const {
    quoteForSwap,
    priceImpact,
    tokenOut,
    quoteLoading,
    priceImpactLoading,
  } = useQuoteWithSlippage(strategy, debt, true);
  const { network } = useConfig();
  const [showMath, setShowMath] = useState<boolean>(false);
  const [hideMaxLabel, setHideMaxLabel] = useState<boolean>(false);

  const addCollateralAndSwap = useCallback(async () => {
    const tokenIds = nftsSelected.map((id) => deconstructFromId(id)[1]);

    const nextNonce = await getNextVaultNonceForUser(strategy, address!);

    const baseRequest: Partial<AddCollateralArgsStruct> = {
      vaultNonce: ethers.BigNumber.from(nextNonce),
      oracleInfo: {
        price: ethers.utils.parseUnits(PRICE.toString(), 18),
        period: ethers.BigNumber.from(0),
      },
      sig: {
        v: ethers.BigNumber.from(1),
        r: ethers.utils.formatBytes32String('x'),
        s: ethers.utils.formatBytes32String('y'),
      },
    };

    const addCollateralArgs = tokenIds.map((tokenId) => ({
      ...baseRequest,
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
      vaultNonce: ethers.BigNumber.from(nextNonce),
      debt: ethers.utils.parseUnits(debt, strategy.underlying.decimals),
      minOut: ethers.utils.parseUnits(quoteForSwap, tokenOut.decimals),
      proceedsTo: address!,
      sqrtPriceLimitX96: strategy.token0IsUnderlying
        ? ethers.BigNumber.from(TickMath.MAX_SQRT_RATIO.toString()).sub(1)
        : ethers.BigNumber.from(TickMath.MIN_SQRT_RATIO.toString()).add(1),
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
  }, [
    address,
    nftsSelected,
    debt,
    network,
    signer,
    strategy,
    quoteForSwap,
    tokenOut.decimals,
  ]);

  // TODO: I think useCallback may not be able to introspect the debounced
  // function this produces. May need to either manually handle debounce with
  // timeouts or do something else.
  const handleDebtAmountChanged = useCallback(
    debounce(async (value: string) => {
      setDebt(value);

      if (value === '') {
        setLiquidationDateEstimation('');
        return;
      }

      setLiquidationDateEstimation(
        await (
          await computeLiquidationEstimation(
            ethers.BigNumber.from(value),
            ethers.BigNumber.from(maxDebt),
            strategy,
          )
        ).toFixed(0),
      );
    }, 500),
    [setDebt, maxDebt],
  );

  const getMaxDebt = useCallback(async () => {
    const newNorm = await strategy.contract.newNorm();
    const maxLTV = await strategy.contract.maxLTV();

    const maxDebt = maxLTV
      .mul(ethers.BigNumber.from(PRICE))
      .div(newNorm)
      .mul(ethers.BigNumber.from(nftsSelected.length));

    setMaxDebt(maxDebt.toString());
  }, [strategy, nftsSelected]);

  const maxLTV = useMemo(() => {
    return strategy.maxLTVPercent;
  }, [strategy]);

  useEffect(() => {
    getMaxDebt();
  }, [getMaxDebt]);

  return (
    <Fieldset legend="🏦 Set Loan Amount">
      <div className={styles.borrowComponentWrapper}>
        <div className={styles.sliderWrapper}>
          <Slider
            min={0}
            max={parseFloat(maxDebt)}
            onChange={(val, _index) => handleDebtAmountChanged(val.toString())}
            renderThumb={(props, state) => {
              let currentLTV: number;
              if (maxDebt === '0') {
                currentLTV = 0;
              } else {
                currentLTV = (state.valueNow / parseFloat(maxDebt)) * maxLTV;
              }

              if (maxLTV - currentLTV <= 12) {
                setHideMaxLabel(true);
              } else {
                setHideMaxLabel(false);
              }
              return (
                <div {...props}>
                  <div
                    className={`${styles.sliderLabel} ${
                      currentLTV < 5 ? styles.sliderLabelPushed : ''
                    }`}>
                    <p>Loan Amount</p>
                    <p>{currentLTV.toFixed(2)}% LTV</p>
                  </div>
                </div>
              );
            }}
          />
          <p
            className={`${hideMaxLabel ? styles.hidden : ''} ${
              styles.sliderLabel
            }`}>
            Max Loan {maxLTV.toString()}% LTV
          </p>
        </div>

        <div className={styles.mathWrapper}>
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

          <div className={styles.borrowButton} onClick={addCollateralAndSwap}>
            Borrow
          </div>
        </div>

        <VaultMath
          strategy={strategy}
          pricesData={pricesData}
          inputtedLTV={(
            (parseFloat(debt) / parseFloat(maxDebt)) *
            maxLTV
          ).toFixed(2)}
          quoteForSwap={quoteForSwap}
          showMath={showMath}
        />
      </div>
    </Fieldset>
  );
}
