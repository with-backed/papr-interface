import { Button, TransactionButton } from 'components/Button';
import { CenterAsset } from 'components/CenterAsset';
import { VaultDebtSlider } from 'components/Controllers/OpenVault/VaultDebtSlider';
import { Fieldset } from 'components/Fieldset';
import {
  ApproveNFTButton,
  ApproveTokenButton,
  BorrowPerpetualButton,
  BorrowWithSwapButton,
  RepayPerpetualButton,
  RepayWithSwapButton,
} from 'components/LoanWriteButtons/UpdateLoanButtons';
import { Table } from 'components/Table';
import { Toggle } from 'components/Toggle';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { CenterUserNFTsResponse } from 'hooks/useCenterNFTs';
import { useConfig } from 'hooks/useConfig';
import { OracleInfo, useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { SupportedToken } from 'lib/config';
import { Quoter } from 'lib/contracts';
import {
  computeSlippageForSwap,
  deconstructFromId,
  getQuoteForSwap,
  getQuoteForSwapOutput,
  getUniqueNFTId,
} from 'lib/controllers';
import { formatBigNum } from 'lib/numberFormat';
import { PaprController } from 'lib/PaprController';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ERC20__factory, ERC721__factory } from 'types/generated/abis';
import { VaultsByOwnerForControllerQuery } from 'types/generated/graphql/inKindSubgraph';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import styles from './VaultDebtPicker.module.css';

type VaultDebtPickerProps = {
  paprController: PaprController;
  oracleInfo: OracleInfo;
  vault: VaultsByOwnerForControllerQuery['vaults']['0'] | undefined;
  collateralContractAddress: string;
  userNFTsForVault: CenterUserNFTsResponse[];
};

export function VaultDebtPicker({
  paprController,
  oracleInfo,
  vault,
  collateralContractAddress,
  userNFTsForVault,
}: VaultDebtPickerProps) {
  // init hooks
  const { address } = useAccount();
  const { tokenName } = useConfig();
  const signerOrProvider = useSignerOrProvider();

  // nft variables
  const [depositNFTs, setDepositNFTs] = useState<string[]>([]);
  const [withdrawNFTs, setWithdrawNFTs] = useState<string[]>([]);

  const numCollateralForMaxDebt = useMemo(() => {
    return (
      (vault?.collateral.length || 0) + depositNFTs.length - withdrawNFTs.length
    );
  }, [vault?.collateral.length, depositNFTs, withdrawNFTs]);

  const userAndVaultNFTs = useMemo(() => {
    return userNFTsForVault
      .map((nft) => ({
        address: nft.address,
        tokenId: nft.tokenId,
        inVault: false,
      }))
      .concat(
        (vault?.collateral || []).map((c) => ({
          address: c.contractAddress,
          tokenId: c.tokenId,
          inVault: true,
        })),
      );
  }, [userNFTsForVault, vault?.collateral]);

  // debt variables
  const maxDebtPerNFTInPerpetual = useAsyncValue(async () => {
    return paprController.maxDebt([collateralContractAddress], oracleInfo);
  }, [paprController, collateralContractAddress, oracleInfo]);

  const maxDebtPerNFTInUnderlying = useAsyncValue(async () => {
    if (!oracleInfo || !maxDebtPerNFTInPerpetual) return null;
    return getQuoteForSwap(
      maxDebtPerNFTInPerpetual,
      paprController.debtToken.id,
      paprController.underlying.id,
      tokenName as SupportedToken,
    );
  }, [maxDebtPerNFTInPerpetual, tokenName, paprController, oracleInfo]);

  const maxDebt = useMemo(() => {
    if (!maxDebtPerNFTInPerpetual) return null;
    return maxDebtPerNFTInPerpetual.mul(numCollateralForMaxDebt);
  }, [maxDebtPerNFTInPerpetual, numCollateralForMaxDebt]);
  const maxDebtNumber = useMemo(() => {
    if (!maxDebt) return null;
    return parseFloat(
      ethers.utils.formatUnits(maxDebt, paprController.debtToken.decimals),
    );
  }, [maxDebt, paprController.debtToken.decimals]);

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
        paprController.debtToken.decimals,
      ),
    );
  }, [currentVaultDebt, paprController.debtToken.decimals]);

  const [controlledSliderValue, setControlledSliderValue] = useState<number>(
    currentVaultDebtNumber,
  );
  const [chosenDebt, setChosenDebt] = useState<ethers.BigNumber>(
    ethers.BigNumber.from(vault?.debt || 0),
  );

  const [isBorrowing, setIsBorrowing] = useState<boolean>(true);
  const [usingPerpetual, setUsingPerpetual] = useState<boolean>(true);
  const [hideLoanFormToggle, setHideLoanFormToggle] = useState<boolean>(true);

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
        paprController.debtToken.id,
        paprController.underlying.id,
        tokenName as SupportedToken,
      );
      const slippage = await computeSlippageForSwap(
        quote,
        paprController.debtToken,
        paprController.underlying,
        debtToBorrowOrRepay,
        true,
        tokenName as SupportedToken,
      );
      return [quote, slippage];
    }, [
      isBorrowing,
      debtToBorrowOrRepay,
      paprController.debtToken,
      paprController.underlying,
      tokenName,
    ]);
  const underlyingToBorrow = useMemo(() => {
    if (!underlyingBorrowQuote) return ethers.BigNumber.from(0);
    return underlyingBorrowQuote[0];
  }, [underlyingBorrowQuote]);
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
        paprController.debtToken.id,
        tokenName as SupportedToken,
      );
      const slippage = await computeSlippageForSwap(
        quote,
        paprController.underlying,
        paprController.debtToken,
        debtToBorrowOrRepay,
        false,
        tokenName as SupportedToken,
      );
      return [quote, slippage];
    }, [
      isBorrowing,
      debtToBorrowOrRepay,
      paprController.debtToken,
      paprController.underlying,
      tokenName,
    ]);
  const underlyingToRepay = useMemo(() => {
    if (!underlyingRepayQuote) return ethers.BigNumber.from(0);
    return underlyingRepayQuote[0];
  }, [underlyingRepayQuote]);
  const slippageForRepay = useMemo(() => {
    if (!underlyingRepayQuote) return 0;
    return underlyingRepayQuote[1];
  }, [underlyingRepayQuote]);

  const amountToBorrowOrRepay = useMemo(() => {
    if (usingPerpetual) return debtToBorrowOrRepay;
    else {
      return isBorrowing ? underlyingToBorrow : underlyingToRepay;
    }
  }, [
    usingPerpetual,
    isBorrowing,
    underlyingToBorrow,
    underlyingToRepay,
    debtToBorrowOrRepay,
  ]);

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

  const connectedNFT = useMemo(() => {
    return ERC721__factory.connect(collateralContractAddress, signerOrProvider);
  }, [collateralContractAddress, signerOrProvider]);
  const nftSymbol = useAsyncValue(() => connectedNFT.symbol(), [connectedNFT]);

  const maxLTV = useAsyncValue(
    () => paprController.maxLTVPercent(),
    [paprController],
  );

  const handleChosenDebtChanged = useCallback(
    (value: string) => {
      if (!value) return;
      const debtBigNumber = ethers.utils.parseUnits(
        value,
        paprController.debtToken.decimals,
      );
      setChosenDebt(debtBigNumber);
    },
    [paprController.debtToken.decimals],
  );

  const [collateralApproved, setCollateralApproved] = useState<boolean>(false);
  const [underlyingApproved, setUnderlyingApproved] = useState<boolean>(false);
  const [debtTokenApproved, setDebtTokenApproved] = useState<boolean>(false);

  const underlyingBalance = useAsyncValue(async () => {
    if (!address) return null;
    return ERC20__factory.connect(
      paprController.underlying.id,
      signerOrProvider,
    ).balanceOf(address);
  }, [paprController.underlying.id, signerOrProvider, address]);
  const debtTokenBalance = useAsyncValue(async () => {
    if (!address) return null;
    return ERC20__factory.connect(
      paprController.debtToken.id,
      signerOrProvider,
    ).balanceOf(address);
  }, [paprController.debtToken.id, signerOrProvider, address]);

  const balanceErrorMessage = useMemo(() => {
    if (!underlyingBalance || !debtTokenBalance) return '';
    if (isBorrowing) return '';
    if (usingPerpetual)
      return debtTokenBalance.lt(debtToBorrowOrRepay)
        ? 'Insufficient paprTrash balance'
        : '';
    if (!usingPerpetual && !!underlyingRepayQuote)
      return underlyingBalance.lt(underlyingRepayQuote[0])
        ? 'Insufficient USDC balance'
        : '';

    return '';
  }, [
    underlyingBalance,
    debtTokenBalance,
    isBorrowing,
    usingPerpetual,
    debtToBorrowOrRepay,
    underlyingRepayQuote,
  ]);

  return (
    <Fieldset legend={`💸 ${nftSymbol}`}>
      <Table className={styles.collateralTable}>
        <thead>
          <tr>
            <th></th>
            <th>
              <p>ID</p>
            </th>
            <th>
              <p>FLOOR VALUE</p>
            </th>
            <th>
              <p>MAX BORROW</p>
            </th>
            <th>
              <p>DEPOSIT</p>
            </th>
            {vaultHasCollateral && (
              <th>
                <p>WITHDRAW</p>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {maxDebtPerNFTInUnderlying &&
            userAndVaultNFTs.map((nft) => (
              <CollateralRow
                key={`${nft.address}-${nft.tokenId}`}
                contractAddress={nft.address}
                tokenId={nft.tokenId}
                floorPrice={oracleInfo[getAddress(nft.address)].price}
                inVault={nft.inVault}
                vaultHasCollateral={vaultHasCollateral}
                maxBorrow={formatBigNum(
                  maxDebtPerNFTInUnderlying,
                  paprController.underlying.decimals,
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
            controller={paprController}
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
          <div className={`${!vaultHasDebt ? styles.hidden : ''}`}>
            <Button
              size="xsmall"
              theme="white"
              kind="outline"
              onClick={() => setHideLoanFormToggle(!hideLoanFormToggle)}>
              Edit Loan
            </Button>
          </div>
          {!loanFormHidden && (
            <div className={styles.editLoanForm}>
              {vaultHasDebt && (
                <div>
                  <Toggle
                    leftText="Borrow"
                    rightText="Repay"
                    hideRightText={currentVaultDebt.isZero()}
                    checked={isBorrowing}
                    onChange={() => {
                      setChosenDebt(currentVaultDebt);
                      setControlledSliderValue(currentVaultDebtNumber);
                      setIsBorrowing(!isBorrowing);
                    }}
                  />
                </div>
              )}
              <div>
                {amountToBorrowOrRepay && (
                  <AmountToBorrowOrRepayInput
                    paprController={paprController}
                    debtToBorrowOrRepay={debtToBorrowOrRepay}
                    isBorrowing={isBorrowing}
                    currentVaultDebt={currentVaultDebt}
                    setControlledSliderValue={setControlledSliderValue}
                    setChosenDebt={setChosenDebt}
                  />
                )}
              </div>
            </div>
          )}
        </div>
        {!loanFormHidden && (
          <>
            <LoanActionSummary
              controller={paprController}
              debtToBorrowOrRepay={debtToBorrowOrRepay}
              quote={isBorrowing ? underlyingToBorrow : underlyingToRepay}
              isBorrowing={isBorrowing}
              usingPerpetual={usingPerpetual}
              setUsingPerpetual={setUsingPerpetual}
              slippage={isBorrowing ? slippageForBorrow : slippageForRepay}
              errorMessage={balanceErrorMessage}
            />
            <div className={styles.approveButtons}>
              <ApproveNFTButton
                paprController={paprController}
                collateralContractAddress={collateralContractAddress}
                approved={collateralApproved}
                setApproved={setCollateralApproved}
              />
              {usingPerpetual && !isBorrowing && (
                <ApproveTokenButton
                  controller={paprController}
                  token={
                    paprController.token0IsUnderlying
                      ? paprController.token1
                      : paprController.token0
                  }
                  tokenApproved={debtTokenApproved}
                  setTokenApproved={setDebtTokenApproved}
                />
              )}
              {!usingPerpetual && !isBorrowing && (
                <ApproveTokenButton
                  controller={paprController}
                  token={
                    paprController.token0IsUnderlying
                      ? paprController.token0
                      : paprController.token1
                  }
                  tokenApproved={underlyingApproved}
                  setTokenApproved={setUnderlyingApproved}
                />
              )}
            </div>
            <div className={styles.updateLoanButtonWrapper}>
              {usingPerpetual && isBorrowing && (
                <BorrowPerpetualButton
                  amount={amountToBorrowOrRepay}
                  collateralContractAddress={collateralContractAddress}
                  depositNFTs={depositNFTs}
                  withdrawNFTs={withdrawNFTs}
                  paprController={paprController}
                  oracleInfo={oracleInfo}
                  vaultHasDebt={vaultHasDebt}
                  disabled={!collateralApproved}
                />
              )}
              {usingPerpetual && !isBorrowing && (
                <RepayPerpetualButton
                  amount={amountToBorrowOrRepay}
                  collateralContractAddress={collateralContractAddress}
                  depositNFTs={depositNFTs}
                  withdrawNFTs={withdrawNFTs}
                  paprController={paprController}
                  oracleInfo={oracleInfo}
                  vaultHasDebt={vaultHasDebt}
                  disabled={!!balanceErrorMessage || !debtTokenApproved}
                />
              )}
              {!usingPerpetual && !isBorrowing && (
                <RepayWithSwapButton
                  amount={amountToBorrowOrRepay}
                  quote={debtToBorrowOrRepay}
                  collateralContractAddress={collateralContractAddress}
                  depositNFTs={depositNFTs}
                  withdrawNFTs={withdrawNFTs}
                  paprController={paprController}
                  oracleInfo={oracleInfo}
                  vaultHasDebt={vaultHasDebt}
                  disabled={!!balanceErrorMessage || !underlyingApproved}
                />
              )}
              {!usingPerpetual && isBorrowing && (
                <BorrowWithSwapButton
                  amount={debtToBorrowOrRepay}
                  quote={underlyingToBorrow}
                  collateralContractAddress={collateralContractAddress}
                  depositNFTs={depositNFTs}
                  withdrawNFTs={withdrawNFTs}
                  paprController={paprController}
                  oracleInfo={oracleInfo}
                  vaultHasDebt={vaultHasDebt}
                  disabled={!collateralApproved}
                />
              )}
            </div>
          </>
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
    () => paprController.debtToken.decimals,
    [paprController.debtToken.decimals],
  );

  const [amount, setAmount] = useState<string>(
    ethers.utils.formatUnits(debtToBorrowOrRepay, decimals),
  );
  const [editingInput, setEditingInput] = useState<boolean>(false);

  const inputValue = useMemo(() => {
    const amountBigNumber = !!amount
      ? ethers.utils.parseUnits(amount, decimals)
      : ethers.BigNumber.from(0);
    return formatBigNum(amountBigNumber, decimals);
  }, [amount, decimals]);

  // TODO: need to debounce this
  const handleInputValueChanged = useCallback(
    async (raw: string) => {
      if (!raw) setAmount('0');

      const val = raw.substring(0, raw.indexOf(' '));

      setAmount(val);

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
    <input
      value={`${inputValue} papr`}
      onChange={(e) => handleInputValueChanged(e.target.value)}
      onFocus={() => setEditingInput(true)}
      onBlur={() => setEditingInput(false)}
    />
  );
}

type CollateralRowProps = {
  contractAddress: string;
  tokenId: string;
  floorPrice: number;
  maxBorrow: string;
  inVault: boolean;
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
  vaultHasCollateral,
  depositNFTs,
  withdrawNFTs,
  setDepositNFTs,
  setWithdrawNFTs,
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
    },
    [depositNFTs, withdrawNFTs, setDepositNFTs, setWithdrawNFTs],
  );

  return (
    <tr>
      <td>
        <div className={styles.thumbnail}>
          <CenterAsset address={contractAddress} tokenId={tokenId} />
        </div>
      </td>
      <td>
        <p>#{tokenId}</p>
      </td>
      <td>
        <p>${floorPrice}</p>
      </td>
      <td>
        <p>${maxBorrow}</p>
      </td>
      <td>
        <input
          type="checkbox"
          disabled={inVault}
          checked={checkedForDeposit || inVault}
          onClick={() => handleInputBoxChecked('deposit', uniqueNFTId)}
        />
      </td>
      {vaultHasCollateral && (
        <td>
          <input
            type="checkbox"
            disabled={!inVault}
            checked={checkedForWithdraw}
            onClick={() => handleInputBoxChecked('withdraw', uniqueNFTId)}
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
  slippage,
  setUsingPerpetual,
  errorMessage,
}: LoanActionSummaryProps) {
  return (
    <div className={styles.loanActionSummaryWrapper}>
      <div className={styles.loanActionSummary}>
        <div>
          <div>
            <p>{isBorrowing ? 'Borrow' : 'Repay'} paprTRASH</p>
          </div>
          <div>
            <p>
              {formatBigNum(debtToBorrowOrRepay, controller.debtToken.decimals)}
            </p>
          </div>
        </div>
        <div>
          <div className={styles.swapQuote}>
            <input
              type="checkbox"
              onChange={() => setUsingPerpetual(!usingPerpetual)}
            />
            {isBorrowing && <p>Swap for USDC</p>}
            {!isBorrowing && <p>Swap from USDC</p>}
          </div>
          <div>
            {quote && (
              <p className={`${usingPerpetual ? styles.greyed : ''}`}>
                {formatBigNum(quote, controller.underlying.decimals)}
              </p>
            )}
            {!quote && <p>...</p>}
          </div>
        </div>
        <div className={`${usingPerpetual ? styles.greyed : ''}`}>
          <div>
            <p>Slippage</p>
          </div>
          <div>
            {slippage !== null && <p>{slippage.toFixed(2)}%</p>}
            {slippage === null && <p>...</p>}
          </div>
        </div>
        <div>
          <div>
            <p>
              {isBorrowing ? 'Receive' : 'Pay'}{' '}
              {usingPerpetual ? 'paprTrash' : 'USDC'}
            </p>
          </div>
          <div>
            {usingPerpetual
              ? formatBigNum(debtToBorrowOrRepay, controller.debtToken.decimals)
              : quote && formatBigNum(quote, controller.underlying.decimals)}
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
