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
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { PaprController, useController } from 'hooks/useController';
import { useMaxDebt } from 'hooks/useMaxDebt';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { useTheme } from 'hooks/useTheme';
import { VaultWriteType } from 'hooks/useVaultWrite/helpers';
import { SupportedToken } from 'lib/config';
import {
  computeSlippageForSwap,
  convertOneScaledValue,
  getQuoteForSwap,
  getQuoteForSwapOutput,
  getUniqueNFTId,
} from 'lib/controllers';
import { calculateSwapFee } from 'lib/controllers/fees';
import { formatBigNum } from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Input, TooltipReference, useTooltipState } from 'reakit';
import { VaultsByOwnerForControllerQuery } from 'types/generated/graphql/inKindSubgraph';
import {
  AuctionsByNftOwnerDocument,
  AuctionsByNftOwnerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import { useAccount } from 'wagmi';

import styles from './VaultDebtPicker.module.css';

type VaultDebtPickerProps = {
  oracleInfo: OracleInfo;
  vault: VaultsByOwnerForControllerQuery['vaults']['0'] | undefined;
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
  const { address } = useAccount();
  const { tokenName } = useConfig();
  const signerOrProvider = useSignerOrProvider();
  const theme = useTheme();

  // nft variables
  const [depositNFTs, setDepositNFTs] = useState<string[]>([]);
  const [withdrawNFTs, setWithdrawNFTs] = useState<string[]>([]);

  const numCollateralForMaxDebt = useMemo(() => {
    return (
      (vault?.collateral.length || 0) + depositNFTs.length - withdrawNFTs.length
    );
  }, [vault?.collateral.length, depositNFTs, withdrawNFTs]);

  const [{ data: auctionsByNftOwner, fetching, error }] =
    useQuery<AuctionsByNftOwnerQuery>({
      query: AuctionsByNftOwnerDocument,
      variables: {
        nftOwner: address!,
      },
    });

  const userAndVaultNFTs = useMemo(() => {
    return (vault?.collateral || [])
      .map((c) => ({
        address: vault?.token.id,
        tokenId: c.tokenId,
        inVault: true,
        isLiquidating: false,
        isLiquidated: false,
      }))
      .concat(
        (auctionsByNftOwner?.auctions || []).map((a) => ({
          address: a.auctionAssetContract.id,
          tokenId: a.auctionAssetID,
          inVault: false,
          isLiquidating: !a.endPrice,
          isLiquidated: !!a.endPrice,
        })),
      )
      .concat(
        userNFTsForVault
          .filter(
            // filter out nfts that are already in the vault, major assumption here is goldsky is faster than thegraph
            (nft) =>
              vault?.collateral.find(
                (c) =>
                  getAddress(vault.token.id) === getAddress(nft.address) &&
                  c.tokenId === nft.tokenId,
              ) === undefined,
          )
          .map((nft) => ({
            address: nft.address,
            tokenId: nft.tokenId,
            inVault: false,
            isLiquidating: false,
            isLiquidated: false,
          })),
      );
  }, [userNFTsForVault, vault, auctionsByNftOwner?.auctions]);

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

  const underlyingBorrowQuote: [ethers.BigNumber, number] | null =
    useAsyncValue(async () => {
      if (debtToBorrowOrRepay.isZero() || !isBorrowing)
        return [ethers.BigNumber.from(0), 0];
      const quote = await getQuoteForSwap(
        debtToBorrowOrRepay,
        paprController.paprToken.id,
        paprController.underlying.id,
        tokenName as SupportedToken,
      );
      if (!quote) return null;
      const slippage = await computeSlippageForSwap(
        quote,
        paprController.paprToken,
        paprController.underlying,
        debtToBorrowOrRepay,
        true,
        tokenName as SupportedToken,
      );
      return [quote, slippage];
    }, [
      isBorrowing,
      debtToBorrowOrRepay,
      paprController.paprToken,
      paprController.underlying,
      tokenName,
    ]);
  const underlyingToBorrow = useMemo(() => {
    if (!underlyingBorrowQuote) return ethers.BigNumber.from(0);
    return underlyingBorrowQuote[0];
  }, [underlyingBorrowQuote]);
  const underlyingBorrowFee = useMemo(() => {
    if (!underlyingBorrowQuote || usingPerpetual) return null;
    return calculateSwapFee(underlyingBorrowQuote[0]);
  }, [underlyingBorrowQuote, usingPerpetual]);

  const slippageForBorrow = useMemo(() => {
    if (!underlyingBorrowQuote) return 0;
    return underlyingBorrowQuote[1];
  }, [underlyingBorrowQuote]);

  const underlyingRepayQuote: [ethers.BigNumber, number] | null =
    useAsyncValue(async () => {
      if (isBorrowing || debtToBorrowOrRepay.isZero())
        return [ethers.BigNumber.from(0), 0];
      const quote = await getQuoteForSwapOutput(
        debtToBorrowOrRepay,
        paprController.underlying.id,
        paprController.paprToken.id,
        tokenName as SupportedToken,
      );
      if (!quote) return null;
      const slippage = await computeSlippageForSwap(
        quote,
        paprController.underlying,
        paprController.paprToken,
        debtToBorrowOrRepay,
        false,
        tokenName as SupportedToken,
      );
      return [quote, slippage];
    }, [
      isBorrowing,
      debtToBorrowOrRepay,
      paprController.paprToken,
      paprController.underlying,
      tokenName,
    ]);
  const underlyingToRepay = useMemo(() => {
    if (!underlyingRepayQuote) return ethers.BigNumber.from(0);
    return underlyingRepayQuote[0];
  }, [underlyingRepayQuote]);
  const underlyingRepayFee = useMemo(() => {
    if (!underlyingRepayQuote || usingPerpetual) return null;
    return calculateSwapFee(underlyingRepayQuote[0]);
  }, [underlyingRepayQuote, usingPerpetual]);

  const slippageForRepay = useMemo(() => {
    if (!underlyingRepayQuote) return 0;
    return underlyingRepayQuote[1];
  }, [underlyingRepayQuote]);

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

  const nftSymbol = useMemo(
    () =>
      paprController.allowedCollateral.find(
        (ac) =>
          getAddress(ac.token.id) === getAddress(collateralContractAddress),
      )!.token.symbol,
    [paprController.allowedCollateral, collateralContractAddress],
  );

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
              />
            ))}
        </tbody>
      </Table>
      <div className={styles.slider}>
        {!!maxDebtPerNFTInPerpetual && maxDebt && (
          <VaultDebtSlider
            currentVaultDebtNumber={currentVaultDebtNumber}
            maxDebtNumber={maxDebtNumber!}
            controlledSliderValue={controlledSliderValue}
            setControlledSliderValue={setControlledSliderValue}
            handleChosenDebtChanged={handleChosenDebtChanged}
            maxLTV={maxLTV}
            setIsBorrowing={setIsBorrowing}
            setHideLoanFormToggle={setHideLoanFormToggle}
          />
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
                  paprController={paprController}
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
              controller={paprController}
              debtToBorrowOrRepay={debtToBorrowOrRepay}
              quote={isBorrowing ? underlyingToBorrow : underlyingToRepay}
              fee={isBorrowing ? underlyingBorrowFee : underlyingRepayFee}
              isBorrowing={isBorrowing}
              usingPerpetual={usingPerpetual}
              setUsingPerpetual={setUsingPerpetual}
              slippage={isBorrowing ? slippageForBorrow : slippageForRepay}
              errorMessage={errorMessage}
            />
            <VaultWriteButton
              writeType={writeType}
              amount={amount}
              quote={quote}
              collateralContractAddress={collateralContractAddress}
              depositNFTs={depositNFTs}
              withdrawNFTs={withdrawNFTs}
              vaultHasDebt={vaultHasDebt}
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

type AmountToBorrowOrRepayInputProps = {
  paprController: PaprController;
  isBorrowing: boolean;
  currentVaultDebt: ethers.BigNumber;
  debtToBorrowOrRepay: ethers.BigNumber;
  setControlledSliderValue: (val: number) => void;
  setChosenDebt: (val: ethers.BigNumber) => void;
};

function AmountToBorrowOrRepayInput({
  paprController,
  isBorrowing,
  currentVaultDebt,
  debtToBorrowOrRepay,
  setControlledSliderValue,
  setChosenDebt,
}: AmountToBorrowOrRepayInputProps) {
  const decimals = useMemo(
    () => paprController.paprToken.decimals,
    [paprController.paprToken.decimals],
  );

  const [amount, setAmount] = useState<string>(
    ethers.utils.formatUnits(debtToBorrowOrRepay, decimals),
  );
  const [editingInput, setEditingInput] = useState<boolean>(false);

  const inputValue = useMemo(() => {
    if (editingInput) return amount;
    const amountBigNumber = amount
      ? ethers.utils.parseUnits(amount, decimals)
      : ethers.BigNumber.from(0);
    return formatBigNum(amountBigNumber, decimals);
  }, [amount, decimals, editingInput]);

  const handleInputValueChanged = useCallback(
    async (val: string) => {
      setAmount(val);
      if (!val || isNaN(parseFloat(val)) || parseFloat(val) < 0) return; // do not change slider if input is invalid

      const debtDelta: ethers.BigNumber = ethers.utils.parseUnits(
        val,
        decimals,
      );

      const newDebt = isBorrowing
        ? currentVaultDebt.add(debtDelta)
        : currentVaultDebt.sub(debtDelta);
      const formattedNewDebt = formatBigNum(newDebt, decimals);

      setChosenDebt(newDebt);
      setControlledSliderValue(parseFloat(formattedNewDebt));
    },
    [
      decimals,
      setChosenDebt,
      setControlledSliderValue,
      isBorrowing,
      currentVaultDebt,
    ],
  );

  useEffect(() => {
    if (!editingInput) {
      setAmount(formatBigNum(debtToBorrowOrRepay, decimals));
    }
  }, [debtToBorrowOrRepay, decimals, editingInput]);

  return (
    <span className={styles.debtAmountInputWrapper}>
      <Input
        value={`${inputValue}`}
        type="number"
        onChange={(e) => handleInputValueChanged(e.target.value)}
        onFocus={() => setEditingInput(true)}
        onBlur={() => setEditingInput(false)}
      />
    </span>
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
}: CollateralRowProps) {
  const controller = useController();
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
    },
    [depositNFTs, withdrawNFTs, setDepositNFTs, setWithdrawNFTs],
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

type LoanActionSummaryProps = {
  controller: PaprController;
  isBorrowing: boolean;
  usingPerpetual: boolean;
  debtToBorrowOrRepay: ethers.BigNumber;
  quote: ethers.BigNumber | null;
  fee: ethers.BigNumber | null;
  slippage: number | null;
  setUsingPerpetual: (val: boolean) => void;
  errorMessage: string;
};

function LoanActionSummary({
  controller,
  isBorrowing,
  usingPerpetual,
  debtToBorrowOrRepay,
  quote,
  fee,
  slippage,
  setUsingPerpetual,
  errorMessage,
}: LoanActionSummaryProps) {
  const theme = useTheme();

  const quoteWithFee = useMemo(() => {
    if (!quote || !fee) return null;
    if (isBorrowing) return quote.sub(fee);
    else return quote.add(fee);
  }, [quote, fee, isBorrowing]);

  return (
    <div className={styles.loanActionSummaryWrapper}>
      <div className={[styles.loanActionSummary, styles[theme]].join(' ')}>
        <div>
          <div>
            <p>
              {isBorrowing ? 'Borrow' : 'Repay'} {controller.paprToken.symbol}
            </p>
          </div>
          <div>
            <p>
              {formatBigNum(debtToBorrowOrRepay, controller.paprToken.decimals)}
            </p>
          </div>
        </div>
        <div>
          <div className={styles.swapQuote}>
            <input
              type="checkbox"
              onChange={() => setUsingPerpetual(!usingPerpetual)}
            />
            {isBorrowing && <p>Swap for {controller.underlying.symbol}</p>}
            {!isBorrowing && <p>Swap from {controller.underlying.symbol}</p>}
          </div>
          <div>
            {quote && (
              <p
                className={`${
                  usingPerpetual ? [styles.greyed, styles[theme]].join(' ') : ''
                }`}>
                {formatBigNum(quote, controller.underlying.decimals)}
              </p>
            )}
            {!quote && <p>...</p>}
          </div>
        </div>
        <div
          className={`${
            usingPerpetual ? [styles.greyed, styles[theme]].join(' ') : ''
          }`}>
          <div>
            <p>Slippage</p>
          </div>
          <div>
            {slippage !== null && <p>{slippage.toFixed(2)}%</p>}
            {slippage === null && <p>...</p>}
          </div>
        </div>
        <div
          className={`${
            usingPerpetual ? [styles.greyed, styles[theme]].join(' ') : ''
          }`}>
          <div>
            <p>papr.wtf swap fee (0.3%)</p>
          </div>
          <div>
            {fee && <p>{formatBigNum(fee, controller.underlying.decimals)}</p>}
            {!fee && <p>-</p>}
          </div>
        </div>
        <div>
          <div>
            <p>
              {isBorrowing ? 'Receive' : 'Pay'}{' '}
              {usingPerpetual
                ? controller.paprToken.symbol
                : controller.underlying.symbol}
            </p>
          </div>
          <div>
            {usingPerpetual
              ? formatBigNum(debtToBorrowOrRepay, controller.paprToken.decimals)
              : quoteWithFee &&
                formatBigNum(quoteWithFee, controller.underlying.decimals)}
          </div>
        </div>
        {!!errorMessage && (
          <div className={styles.error}>
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
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
  const { tokenName } = useConfig();
  const controller = useController();

  const costToClose = useAsyncValue(async () => {
    if (!vaultHasDebt) return null;
    return getQuoteForSwapOutput(
      vaultDebt,
      controller.underlying.id,
      controller.paprToken.id,
      tokenName as SupportedToken,
    );
  }, [
    vaultHasDebt,
    vaultDebt,
    controller.paprToken.id,
    controller.underlying.id,
    tokenName,
  ]);

  const maxDebtUnderlying = useAsyncValue(async () => {
    if (!maxLoanPerNFT || vaultHasDebt) return null;
    const maxDebtForAllNFTs = maxLoanPerNFT.mul(numberOfNFTs);
    return getQuoteForSwap(
      maxDebtForAllNFTs,
      controller.paprToken.id,
      controller.underlying.id,
      tokenName as SupportedToken,
    );
  }, [
    vaultHasDebt,
    maxLoanPerNFT,
    numberOfNFTs,
    controller.paprToken.id,
    controller.underlying.id,
    tokenName,
  ]);

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
