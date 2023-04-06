import { Button } from 'components/Button';
import { CenterAsset } from 'components/CenterAsset';
import { VaultDebtSlider } from 'components/Controllers/OpenVault/VaultDebtSlider/VaultDebtSlider';
import { VaultWriteButton } from 'components/Controllers/OpenVault/VaultWriteButton';
import { NFTValueTooltip } from 'components/Controllers/TokenPerformance/Tooltips';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { Toggle } from 'components/Toggle';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { AccountNFTsResponse } from 'hooks/useAccountNFTs';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useMaxDebt } from 'hooks/useMaxDebt';
import { useNFTSymbol } from 'hooks/useNFTSymbol';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { usePoolQuote } from 'hooks/usePoolQuote';
import { useTarget } from 'hooks/useTarget';
import { useTheme } from 'hooks/useTheme';
import { useVaultComponentNFTs } from 'hooks/useVaultComponentNFTs';
import { VaultWriteType } from 'hooks/useVaultWrite/helpers';
import { SupportedToken } from 'lib/config';
import {
  computeNewProjectedAPR,
  convertOneScaledValue,
  getUniqueNFTId,
} from 'lib/controllers';
import { price } from 'lib/controllers/charts/mark';
import { calculateSwapFee } from 'lib/controllers/fees';
import { formatBigNum } from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { erc20TokenToToken } from 'lib/uniswapSubgraph';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TooltipReference, useTooltipState } from 'reakit';
import { SubgraphVault } from 'types/SubgraphVault';

import { AmountToBorrowOrRepayInput } from '../AmountToBorrowOrRepayInput';
import { LoanActionSummary } from '../LoanActionSummary';
import { VaultDebtExplainer } from '../VaultDebtExplainer';
import styles from './VaultDebtPicker.module.css';

type VaultDebtPickerProps = {
  oracleInfo: OracleInfo;
  vault: SubgraphVault | undefined;
  collateralContractAddress: string;
  userNFTsForVault: AccountNFTsResponse[];
  refresh: () => void;
};

export function VaultDebtPicker({
  oracleInfo,
  vault,
  collateralContractAddress,
  userNFTsForVault,
  refresh,
}: VaultDebtPickerProps) {
  // init hooks
  const paprController = useController();
  const { tokenName, chainId } = useConfig();
  const target = useTarget();
  const theme = useTheme();

  // nft variables
  const [depositNFTs, setDepositNFTs] = useState<string[]>([]);
  const [withdrawNFTs, setWithdrawNFTs] = useState<string[]>([]);

  const numCollateralForMaxDebt = useMemo(() => {
    return (
      (vault?.collateral.length || 0) + depositNFTs.length - withdrawNFTs.length
    );
  }, [vault?.collateral.length, depositNFTs, withdrawNFTs]);

  const userAndVaultNFTs = useVaultComponentNFTs(
    collateralContractAddress,
    userNFTsForVault,
    vault,
  );

  // debt variables
  const maxDebtPerNFTInPerpetual = useMaxDebt(
    collateralContractAddress,
    OraclePriceType.lower,
  );

  const maxDebt = useMemo(() => {
    if (!maxDebtPerNFTInPerpetual) return null;
    return maxDebtPerNFTInPerpetual.mul(numCollateralForMaxDebt);
  }, [maxDebtPerNFTInPerpetual, numCollateralForMaxDebt]);
  const maxDebtNumber = useMemo(() => {
    if (!maxDebt) return null;
    return parseFloat(
      ethers.utils.formatUnits(maxDebt, paprController.paprToken.decimals),
    );
  }, [maxDebt, paprController.paprToken.decimals]);

  const vaultHasDebt = useMemo(() => {
    if (!vault) return false;
    return !ethers.BigNumber.from(vault.debt).isZero();
  }, [vault]);
  const vaultHasCollateral = useMemo(() => {
    if (!vault) return false;
    return vault.collateral.length > 0;
  }, [vault]);

  useEffect(() => {
    if (!!maxDebt && maxDebt.isZero()) {
      setChosenDebt(ethers.BigNumber.from(0));
      setControlledSliderValue(0);
    }
  }, [maxDebt]);

  const currentVaultDebt = useMemo(() => {
    return ethers.BigNumber.from(vault?.debt || 0);
  }, [vault]);
  const currentVaultDebtNumber = useMemo(() => {
    return parseFloat(
      ethers.utils.formatUnits(
        currentVaultDebt,
        paprController.paprToken.decimals,
      ),
    );
  }, [currentVaultDebt, paprController.paprToken.decimals]);

  const [controlledSliderValue, setControlledSliderValue] = useState<number>(
    currentVaultDebtNumber,
  );
  const [chosenDebt, setChosenDebt] = useState<ethers.BigNumber>(
    ethers.BigNumber.from(vault?.debt || 0),
  );

  // toggle variables
  const [isBorrowing, setIsBorrowing] = useState<boolean>(true);
  const [usingPerpetual, setUsingPerpetual] = useState<boolean>(true);
  const [hideLoanFormToggle, setHideLoanFormToggle] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loanFormHidden = useMemo(() => {
    return hideLoanFormToggle && vaultHasDebt;
  }, [hideLoanFormToggle, vaultHasDebt]);

  const debtToBorrowOrRepay = useMemo(() => {
    if (currentVaultDebt.isZero()) return chosenDebt;
    if (chosenDebt.gt(currentVaultDebt))
      return chosenDebt.sub(currentVaultDebt);
    return currentVaultDebt.sub(chosenDebt);
  }, [chosenDebt, currentVaultDebt]);

  const underlyingBorrowQuote = usePoolQuote({
    amount: debtToBorrowOrRepay,
    inputToken: paprController.underlying,
    outputToken: paprController.paprToken,
    tradeType: 'exactIn',
    withSlippage: true,
    skip: !isBorrowing || debtToBorrowOrRepay.isZero(),
  });

  const underlyingToBorrow = useMemo(() => {
    if (!underlyingBorrowQuote.quote) return ethers.BigNumber.from(0);
    return underlyingBorrowQuote.quote;
  }, [underlyingBorrowQuote]);
  const underlyingBorrowFee = useMemo(() => {
    if (!underlyingBorrowQuote.quote || usingPerpetual) return null;
    return calculateSwapFee(underlyingBorrowQuote.quote);
  }, [underlyingBorrowQuote, usingPerpetual]);

  const slippageForBorrow = useMemo(() => {
    if (!underlyingBorrowQuote.quote) return 0;
    return underlyingBorrowQuote.slippage;
  }, [underlyingBorrowQuote]);

  const nextPriceForBorrow = useMemo(() => {
    if (usingPerpetual || !underlyingBorrowQuote) return null;
    return underlyingBorrowQuote.sqrtPriceX96After;
  }, [usingPerpetual, underlyingBorrowQuote]);

  const underlyingRepayQuote = usePoolQuote({
    amount: debtToBorrowOrRepay,
    inputToken: paprController.underlying,
    outputToken: paprController.paprToken,
    tradeType: 'exactOut',
    withSlippage: true,
    skip: isBorrowing || debtToBorrowOrRepay.isZero(),
  });

  const underlyingToRepay = useMemo(() => {
    if (!underlyingRepayQuote.quote) return ethers.BigNumber.from(0);
    return underlyingRepayQuote.quote;
  }, [underlyingRepayQuote]);
  const underlyingRepayFee = useMemo(() => {
    if (!underlyingRepayQuote.quote || usingPerpetual) return null;
    return calculateSwapFee(underlyingRepayQuote.quote);
  }, [underlyingRepayQuote, usingPerpetual]);

  const slippageForRepay = useMemo(() => {
    if (!underlyingRepayQuote) return 0;
    return underlyingRepayQuote.slippage;
  }, [underlyingRepayQuote]);
  const nextPriceForRepay = useMemo(() => {
    if (usingPerpetual || !underlyingRepayQuote) return null;
    return underlyingRepayQuote.sqrtPriceX96After;
  }, [usingPerpetual, underlyingRepayQuote]);

  useEffect(() => {
    if (chosenDebt.lt(currentVaultDebt)) setIsBorrowing(false);
  }, [chosenDebt, currentVaultDebt]);

  useEffect(() => {
    if (currentVaultDebt.isZero()) {
      setDepositNFTs(
        userNFTsForVault.map((nft) => getUniqueNFTId(nft.address, nft.tokenId)),
      );
    }
  }, [currentVaultDebt, userNFTsForVault]);

  const writeType: VaultWriteType = useMemo(() => {
    if (isBorrowing && usingPerpetual) return VaultWriteType.Borrow;
    else if (isBorrowing && !usingPerpetual)
      return VaultWriteType.BorrowWithSwap;
    else if (!isBorrowing && usingPerpetual) return VaultWriteType.Repay;
    else if (!isBorrowing && !usingPerpetual)
      return VaultWriteType.RepayWithSwap;
    else return VaultWriteType.Borrow; // should never happen
  }, [isBorrowing, usingPerpetual]);

  const [amount, quote] = useMemo(() => {
    switch (writeType) {
      case VaultWriteType.Borrow:
        return [debtToBorrowOrRepay, null];
      case VaultWriteType.BorrowWithSwap:
        return [debtToBorrowOrRepay, underlyingToBorrow];
      case VaultWriteType.Repay:
        return [debtToBorrowOrRepay, null];
      case VaultWriteType.RepayWithSwap:
        return [underlyingToRepay, debtToBorrowOrRepay];
    }
  }, [writeType, debtToBorrowOrRepay, underlyingToRepay, underlyingToBorrow]);

  const projectedAPR = useMemo(() => {
    const newSqrtPriceX96 = isBorrowing
      ? nextPriceForBorrow
      : nextPriceForRepay;
    if (
      !newSqrtPriceX96 ||
      !target ||
      newSqrtPriceX96.isZero() ||
      usingPerpetual
    )
      return null;

    const token0 = paprController.token0IsUnderlying
      ? paprController.underlying
      : paprController.paprToken;
    const baseCurrency = paprController.paprToken;
    const quoteCurrency = paprController.underlying;
    const newPrice = parseFloat(
      price(
        newSqrtPriceX96,
        erc20TokenToToken(baseCurrency, chainId),
        erc20TokenToToken(quoteCurrency, chainId),
        erc20TokenToToken(token0, chainId),
      ).toFixed(),
    );
    const projectedAPRResult = computeNewProjectedAPR(
      newPrice,
      parseFloat(
        ethers.utils.formatUnits(
          ethers.BigNumber.from(target.target),
          paprController.underlying.decimals,
        ),
      ),
      600,
      ethers.BigNumber.from(paprController.fundingPeriod),
      tokenName as SupportedToken,
    );
    return projectedAPRResult.newApr;
  }, [
    isBorrowing,
    usingPerpetual,
    nextPriceForBorrow,
    nextPriceForRepay,
    paprController,
    tokenName,
    target,
    chainId,
  ]);

  const nftSymbol = useNFTSymbol(collateralContractAddress);

  const maxLTV = useMemo(
    () =>
      convertOneScaledValue(ethers.BigNumber.from(paprController.maxLTV), 2),
    [paprController],
  );

  const handleChosenDebtChanged = useCallback(
    (value: string) => {
      if (!value) return;
      const debtBigNumber = ethers.utils.parseUnits(
        value,
        paprController.paprToken.decimals,
      );
      setChosenDebt(debtBigNumber);
    },
    [paprController.paprToken.decimals],
  );

  const nftValueTooltip = useTooltipState({ placement: 'bottom-start' });

  const hideVault = useMemo(() => {
    if (!vault) return userNFTsForVault.length === 0;
    return (
      userNFTsForVault.length === 0 &&
      vault.collateralCount === 0 &&
      !vaultHasDebt
    );
  }, [vault, userNFTsForVault, vaultHasDebt]);

  if (hideVault) return <></>;

  return (
    <Fieldset legend={`💸 ${nftSymbol}`}>
      <Table className={styles.collateralTable}>
        <thead>
          <tr>
            <th></th>
            <th>ID</th>
            <th>
              <TooltipReference {...nftValueTooltip}>
                VALUE
                <br />
                (WETH)
              </TooltipReference>
            </th>
            <NFTValueTooltip tooltip={nftValueTooltip} />
            <th>
              MAX BORROW
              <br />
              (PAPR)
            </th>
            <th>DEPOSIT</th>
            {vaultHasCollateral && <th>WITHDRAW</th>}
          </tr>
        </thead>
        <tbody>
          {maxDebtPerNFTInPerpetual &&
            userAndVaultNFTs.map((nft) => (
              <CollateralRow
                key={`${nft.address}-${nft.tokenId}`}
                contractAddress={collateralContractAddress}
                tokenId={nft.tokenId}
                floorPrice={
                  oracleInfo[getAddress(collateralContractAddress)].price
                }
                inVault={nft.inVault}
                isLiquidating={nft.isLiquidating}
                isLiquidated={nft.isLiquidated}
                vaultHasCollateral={vaultHasCollateral}
                maxBorrow={formatBigNum(
                  maxDebtPerNFTInPerpetual,
                  paprController.paprToken.decimals,
                )}
                depositNFTs={depositNFTs}
                withdrawNFTs={withdrawNFTs}
                setDepositNFTs={setDepositNFTs}
                setWithdrawNFTs={setWithdrawNFTs}
                setHideLoanFormToggle={setHideLoanFormToggle}
              />
            ))}
        </tbody>
      </Table>
      <div className={styles.slider}>
        {!!maxDebtPerNFTInPerpetual && maxDebtNumber && (
          <>
            <VaultDebtSlider
              currentVaultDebtNumber={currentVaultDebtNumber}
              maxDebtNumber={maxDebtNumber}
              controlledSliderValue={controlledSliderValue}
              setControlledSliderValue={setControlledSliderValue}
              handleChosenDebtChanged={handleChosenDebtChanged}
              maxLTV={maxLTV}
              setIsBorrowing={setIsBorrowing}
              setHideLoanFormToggle={setHideLoanFormToggle}
            />
            <VaultDebtExplainer
              maxLTV={maxLTV}
              chosenDebt={controlledSliderValue}
              maxDebt={maxDebtNumber}
              collateralCount={numCollateralForMaxDebt}
              collateralContractAddress={collateralContractAddress}
            />
          </>
        )}
      </div>
      <div className={styles.editLoanPreviewWrapper}>
        <div className={styles.editLoanPreview}>
          <div
            className={`${styles.editLoanButtonWrapper} ${
              !vaultHasDebt ? styles.hidden : ''
            }`}>
            <Button
              size="small"
              theme={theme}
              kind="outline"
              onClick={() => setHideLoanFormToggle(!hideLoanFormToggle)}>
              Edit Loan
            </Button>
          </div>
          {loanFormHidden && (
            <CostToCloseOrMaximumLoan
              vaultHasDebt={vaultHasDebt}
              vaultDebt={currentVaultDebt}
              maxLoanPerNFT={maxDebtPerNFTInPerpetual}
              numberOfNFTs={userNFTsForVault.length}
            />
          )}
          {!loanFormHidden && (
            <div className={styles.editLoanForm}>
              {vaultHasDebt && (
                <div>
                  <Toggle
                    leftText="Borrow"
                    rightText="Repay"
                    checked={isBorrowing}
                    onChange={() => {
                      setChosenDebt(currentVaultDebt);
                      setControlledSliderValue(currentVaultDebtNumber);
                      setIsBorrowing(!isBorrowing);
                    }}
                    theme={theme}
                  />
                </div>
              )}
              {!vaultHasDebt && (
                <div>
                  <p>Loan Amount</p>
                </div>
              )}
              <div>
                <AmountToBorrowOrRepayInput
                  debtToBorrowOrRepay={debtToBorrowOrRepay}
                  isBorrowing={isBorrowing}
                  currentVaultDebt={currentVaultDebt}
                  setControlledSliderValue={setControlledSliderValue}
                  setChosenDebt={setChosenDebt}
                />
              </div>
            </div>
          )}
        </div>
        {!loanFormHidden && (
          <div className={styles['loan-form']}>
            <LoanActionSummary
              debtToBorrowOrRepay={debtToBorrowOrRepay}
              quote={isBorrowing ? underlyingToBorrow : underlyingToRepay}
              fee={isBorrowing ? underlyingBorrowFee : underlyingRepayFee}
              isBorrowing={isBorrowing}
              usingPerpetual={usingPerpetual}
              setUsingPerpetual={setUsingPerpetual}
              slippage={isBorrowing ? slippageForBorrow : slippageForRepay}
              projectedAPR={projectedAPR}
              errorMessage={errorMessage}
            />
            <VaultWriteButton
              writeType={writeType}
              amount={amount}
              quote={quote}
              collateralContractAddress={collateralContractAddress}
              depositNFTs={depositNFTs}
              withdrawNFTs={withdrawNFTs}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
              refresh={refresh}
            />
          </div>
        )}
      </div>
    </Fieldset>
  );
}

type CollateralRowProps = {
  contractAddress: string;
  tokenId: string;
  floorPrice: number;
  maxBorrow: string;
  inVault: boolean;
  isLiquidating: boolean;
  isLiquidated: boolean;
  vaultHasCollateral: boolean;
  depositNFTs: string[];
  withdrawNFTs: string[];
  setDepositNFTs: Dispatch<SetStateAction<string[]>>;
  setWithdrawNFTs: Dispatch<SetStateAction<string[]>>;
  setHideLoanFormToggle: Dispatch<SetStateAction<boolean>>;
};

function CollateralRow({
  contractAddress,
  tokenId,
  floorPrice,
  maxBorrow,
  inVault,
  isLiquidating,
  isLiquidated,
  vaultHasCollateral,
  depositNFTs,
  withdrawNFTs,
  setDepositNFTs,
  setWithdrawNFTs,
  setHideLoanFormToggle,
}: CollateralRowProps) {
  const uniqueNFTId = useMemo(
    () => getUniqueNFTId(contractAddress, tokenId),
    [contractAddress, tokenId],
  );
  const checkedForDeposit = useMemo(
    () => depositNFTs.includes(uniqueNFTId),
    [uniqueNFTId, depositNFTs],
  );
  const checkedForWithdraw = useMemo(
    () => withdrawNFTs.includes(uniqueNFTId),
    [uniqueNFTId, withdrawNFTs],
  );

  const handleInputBoxChecked = useCallback(
    (checkbox: 'withdraw' | 'deposit', nftId: string) => {
      if (checkbox === 'deposit') {
        if (depositNFTs.includes(nftId))
          setDepositNFTs((prev) => prev.filter((nfts) => nfts !== nftId));
        else setDepositNFTs((prev) => [...prev, nftId]);
      } else {
        if (withdrawNFTs.includes(nftId))
          setWithdrawNFTs((prev) => prev.filter((nfts) => nfts !== nftId));
        else setWithdrawNFTs((prev) => [...prev, nftId]);
      }
      setHideLoanFormToggle(false);
    },
    [
      depositNFTs,
      withdrawNFTs,
      setDepositNFTs,
      setWithdrawNFTs,
      setHideLoanFormToggle,
    ],
  );

  return (
    <tr
      className={
        isLiquidating
          ? styles.liquidating
          : isLiquidated
          ? styles.liquidated
          : ''
      }>
      <td>
        <div className={styles.thumbnail}>
          <CenterAsset address={contractAddress} tokenId={tokenId} />
        </div>
      </td>
      <td>
        <p>#{tokenId}</p>
      </td>
      <td>
        {isLiquidated && <p>---</p>}
        {!isLiquidated && <p>{floorPrice}</p>}
      </td>
      <td>
        {isLiquidated && <p>---</p>}
        {!isLiquidated && <p>{maxBorrow}</p>}
      </td>
      <td>
        {!isLiquidating && !isLiquidated && (
          <input
            type="checkbox"
            disabled={inVault}
            checked={checkedForDeposit || inVault}
            onChange={() => handleInputBoxChecked('deposit', uniqueNFTId)}
          />
        )}
        {isLiquidating && <p>Liquidating</p>}
        {isLiquidated && <p>Liquidated</p>}
      </td>
      {vaultHasCollateral && (
        <td>
          <input
            type="checkbox"
            disabled={!inVault}
            checked={checkedForWithdraw}
            onChange={() => handleInputBoxChecked('withdraw', uniqueNFTId)}
          />
        </td>
      )}
    </tr>
  );
}

type CostToCloseOrMaximumLoanProps = {
  vaultHasDebt: boolean;
  vaultDebt: ethers.BigNumber;
  maxLoanPerNFT: ethers.BigNumber | null;
  numberOfNFTs: number;
};

function CostToCloseOrMaximumLoan({
  vaultHasDebt,
  vaultDebt,
  maxLoanPerNFT,
  numberOfNFTs,
}: CostToCloseOrMaximumLoanProps) {
  const controller = useController();

  const { quote: costToClose } = usePoolQuote({
    amount: vaultDebt,
    inputToken: controller.underlying,
    outputToken: controller.paprToken,
    tradeType: 'exactOut',
    withSlippage: false,
    skip: !vaultHasDebt,
  });

  const { quote: maxDebtUnderlying } = usePoolQuote({
    amount: maxLoanPerNFT?.mul(numberOfNFTs),
    inputToken: controller.paprToken,
    outputToken: controller.underlying,
    tradeType: 'exactIn',
    withSlippage: false,
    skip: vaultHasDebt,
  });

  if (vaultDebt && vaultDebt.gt(0)) {
    return (
      <div className={styles.costToCloseOrMax}>
        <div>Cost to close:</div>
        <div>
          {costToClose
            ? formatBigNum(costToClose, controller.underlying.decimals)
            : '...'}{' '}
          {controller.underlying.symbol}
        </div>
      </div>
    );
  } else {
    return (
      <div className={styles.costToCloseOrMax}>
        <div>Max Loan Amount:</div>{' '}
        <div>
          {maxDebtUnderlying
            ? formatBigNum(maxDebtUnderlying, controller.underlying.decimals)
            : '...'}{' '}
          {controller.underlying.symbol}
        </div>
      </div>
    );
  }
}
