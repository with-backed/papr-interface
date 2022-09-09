import { TickMath } from '@uniswap/v3-sdk';
import { Fieldset } from 'components/Fieldset';
import { Slider } from 'components/Slider';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import { LendingStrategy, computeLiquidationEstimation } from 'lib/strategies';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { ONE, PRICE } from 'lib/strategies/constants';
import { ERC721__factory } from 'types/generated/abis';
import { ILendingStrategy } from 'types/generated/abis/Strategy';
import { useAccount, useSigner } from 'wagmi';
import styles from './OpenVault.module.css';
import VaultMath from './VaultMath';
import { StrategyPricesData } from 'lib/strategies/charts';

type BorrowProps = {
  strategy: LendingStrategy;
  pricesData: StrategyPricesData;
};

interface OnERC721ReceivedArgsStruct {
  vaultId: ethers.BigNumber;
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

const OnERC721ReceivedArgsEncoderString = `
  tuple(
    uint256 vaultId,
    uint256 vaultNonce,
    address mintVaultTo,
    address mintDebtOrProceedsTo,
    uint256 minOut,
    int256 debt,
    uint160 sqrtPriceLimitX96,
    tuple(uint128 price, uint8 period) oracleInfo,
    tuple(uint8 v, bytes32 r, bytes32 s) sig
  )
`;

export default function OpenVault({ strategy, pricesData }: BorrowProps) {
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const [debt, setDebt] = useState<string>('');
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

  const create = useCallback(
    async (withSwap: boolean) => {
      const request: OnERC721ReceivedArgsStruct = {
        vaultId: ethers.BigNumber.from(0),
        vaultNonce: ethers.BigNumber.from(0),
        mintVaultTo: address!,
        mintDebtOrProceedsTo: address!,
        minOut: withSwap
          ? ethers.utils.parseUnits(quoteForSwap, tokenOut.decimals)
          : ethers.BigNumber.from(0),
        sqrtPriceLimitX96: strategy.token0IsUnderlying
          ? ethers.BigNumber.from(TickMath.MAX_SQRT_RATIO.toString()).sub(1)
          : ethers.BigNumber.from(TickMath.MIN_SQRT_RATIO.toString()).add(1),
        debt: ethers.utils.parseUnits(debt, strategy.underlying.decimals),
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

      const signerCollateral = ERC721__factory.connect(
        strategy.collateral.contract.address,
        signer!,
      );

      await signerCollateral['safeTransferFrom(address,address,uint256,bytes)'](
        address!,
        strategy.contract.address,
        ethers.BigNumber.from(collateralTokenId),
        ethers.utils.defaultAbiCoder.encode(
          [OnERC721ReceivedArgsEncoderString],
          [request],
        ),
        {
          gasLimit: ethers.utils.hexValue(3000000),
        },
      );

      const filter = strategy.contract.filters.OpenVault(null, address, null);

      strategy.contract.once(filter, (id, to, nonce) => {
        window.location.assign(
          `/network/${network}/in-kind/strategies/${strategy.contract.address}/vaults/${id}`,
        );
      });
    },
    [address, collateralTokenId, debt, network, signer, strategy, quoteForSwap],
  );

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

    const maxDebt = maxLTV.mul(ethers.BigNumber.from(PRICE)).div(newNorm);

    setMaxDebt(maxDebt.toString());
  }, [strategy]);

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
              const currentLTV =
                (state.valueNow / parseFloat(maxDebt)) * maxLTV;

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

          <div className={styles.borrowButton} onClick={() => create(false)}>
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
