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
import { ERC721__factory } from 'types/generated/abis';
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

  const loanAmountInUnderlying = useAsyncValue(async () => {
    if (chosenDebt.isZero()) return ethers.BigNumber.from(0);
    return getQuoteForSwap(
      chosenDebt,
      paprController.debtToken.id,
      paprController.underlying.id,
      tokenName as SupportedToken,
    );
  }, [
    tokenName,
    paprController.debtToken.id,
    paprController.underlying.id,
    chosenDebt,
  ]);

  const [isBorrowing, setIsBorrowing] = useState<boolean>(true);
  const [usingPerpetual, setUsingPerpetual] = useState<boolean>(false);

  const debtToBorrowOrRepay = useMemo(() => {
    if (currentVaultDebt.isZero()) return chosenDebt;
    if (chosenDebt.gt(currentVaultDebt))
      return chosenDebt.sub(currentVaultDebt);
    return currentVaultDebt.sub(chosenDebt);
  }, [chosenDebt, currentVaultDebt]);
  const underlyingToBorrow = useAsyncValue(async () => {
    if (debtToBorrowOrRepay.isZero() || usingPerpetual || !isBorrowing)
      return ethers.BigNumber.from(0);
    return getQuoteForSwap(
      debtToBorrowOrRepay,
      paprController.debtToken.id,
      paprController.underlying.id,
      tokenName as SupportedToken,
    );
  }, [
    usingPerpetual,
    isBorrowing,
    debtToBorrowOrRepay,
    paprController.debtToken.id,
    paprController.underlying.id,
    tokenName,
  ]);
  const slippageForBorrow = useAsyncValue(async () => {
    if (!underlyingToBorrow || underlyingToBorrow.isZero()) return 0;
    return computeSlippageForSwap(
      underlyingToBorrow,
      paprController.debtToken,
      paprController.underlying,
      debtToBorrowOrRepay,
      true,
      tokenName as SupportedToken,
    );
  }, [
    underlyingToBorrow,
    paprController.debtToken,
    paprController.underlying,
    debtToBorrowOrRepay,
    tokenName,
  ]);

  const underlyingToRepay = useAsyncValue(async () => {
    if (usingPerpetual || isBorrowing || debtToBorrowOrRepay.isZero())
      return ethers.BigNumber.from(0);
    return getQuoteForSwapOutput(
      debtToBorrowOrRepay,
      paprController.underlying.id,
      paprController.debtToken.id,
      tokenName as SupportedToken,
    );
  }, [
    isBorrowing,
    usingPerpetual,
    debtToBorrowOrRepay,
    paprController.debtToken.id,
    paprController.underlying.id,
    tokenName,
  ]);
  const slippageForRepay = useAsyncValue(async () => {
    if (!underlyingToRepay || underlyingToRepay.isZero()) {
      return 0;
    }
    return computeSlippageForSwap(
      underlyingToRepay,
      paprController.underlying,
      paprController.debtToken,
      debtToBorrowOrRepay,
      false,
      tokenName as SupportedToken,
    );
  }, [
    underlyingToRepay,
    paprController.debtToken,
    paprController.underlying,
    debtToBorrowOrRepay,
    tokenName,
  ]);

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
          />
        )}
      </div>
      <div className={styles.editLoanPreview}>
        <div>
          <Button size="xsmall" theme="white" kind="outline">
            Edit Loan
          </Button>
        </div>
        <div>
          <p>
            Loan Amount:{' '}
            <span>
              {!!loanAmountInUnderlying &&
                formatBigNum(
                  loanAmountInUnderlying,
                  paprController.underlying.decimals,
                )}{' '}
              USDC
            </span>
          </p>
          <p>
            {formatBigNum(chosenDebt, paprController.debtToken.decimals)}{' '}
            paprTrash
          </p>
        </div>
      </div>
      <div className={styles.editLoanForm}>
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
        <div>
          <Toggle
            leftText="USDC"
            rightText="papr"
            checked={!usingPerpetual}
            onChange={() => setUsingPerpetual(!usingPerpetual)}
          />
        </div>
        <div>
          {amountToBorrowOrRepay && (
            <AmountToBorrowOrRepayInput
              paprController={paprController}
              amountToBorrowOrRepay={amountToBorrowOrRepay}
              isBorrowing={isBorrowing}
              currentVaultDebt={currentVaultDebt}
              usingPerpetual={usingPerpetual}
              setControlledSliderValue={setControlledSliderValue}
              setChosenDebt={setChosenDebt}
            />
          )}
        </div>
      </div>
      <div className={styles.slippage}>
        {(!!slippageForBorrow || !!slippageForRepay) && (
          <p>
            Slippage:{' '}
            {isBorrowing ? (
              <span>{slippageForBorrow?.toFixed(3)}%</span>
            ) : (
              <span>{slippageForRepay?.toFixed(3)}%</span>
            )}
          </p>
        )}
      </div>
      <div className={styles.approveButtons}>
        <ApproveNFTButton
          paprController={paprController}
          collateralContractAddress={collateralContractAddress}
        />
        {usingPerpetual && !isBorrowing && (
          <ApproveTokenButton
            controller={paprController}
            token={
              paprController.token0IsUnderlying
                ? paprController.token1
                : paprController.token0
            }
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
          />
        )}
      </div>
    </Fieldset>
  );
}

type AmountToBorrowOrRepayInputProps = {
  paprController: PaprController;
  usingPerpetual: boolean;
  isBorrowing: boolean;
  currentVaultDebt: ethers.BigNumber;
  amountToBorrowOrRepay: ethers.BigNumber;
  setControlledSliderValue: (val: number) => void;
  setChosenDebt: (val: ethers.BigNumber) => void;
};

function AmountToBorrowOrRepayInput({
  paprController,
  usingPerpetual,
  isBorrowing,
  currentVaultDebt,
  amountToBorrowOrRepay,
  setControlledSliderValue,
  setChosenDebt,
}: AmountToBorrowOrRepayInputProps) {
  const { tokenName } = useConfig();
  const decimals = useMemo(
    () =>
      usingPerpetual
        ? paprController.debtToken.decimals
        : paprController.underlying.decimals,
    [
      usingPerpetual,
      paprController.debtToken.decimals,
      paprController.underlying.decimals,
    ],
  );

  const [amount, setAmount] = useState<string>(
    ethers.utils.formatUnits(amountToBorrowOrRepay, decimals),
  );
  const [editingInput, setEditingInput] = useState<boolean>(false);

  const inputValue = useMemo(() => {
    const amountBigNumber = !!amount
      ? ethers.utils.parseUnits(amount, decimals)
      : ethers.BigNumber.from(0);
    const bigNumberToFormat = editingInput
      ? amountBigNumber
      : amountToBorrowOrRepay;
    return formatBigNum(bigNumberToFormat, decimals);
  }, [amount, decimals, amountToBorrowOrRepay, editingInput]);

  // TODO: need to debounce this
  const handleInputValueChanged = useCallback(
    async (val: string) => {
      if (!val) setAmount('0');
      setAmount(val);

      let debtDelta: ethers.BigNumber;
      if (!usingPerpetual) {
        debtDelta = await getQuoteForSwapOutput(
          ethers.utils.parseUnits(val, decimals),
          paprController.underlying.id,
          paprController.debtToken.id,
          tokenName as SupportedToken,
        );
      } else {
        debtDelta = ethers.utils.parseUnits(val, decimals);
      }

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
      paprController.underlying.id,
      paprController.debtToken.id,
      isBorrowing,
      currentVaultDebt,
      tokenName,
      usingPerpetual,
    ],
  );

  useEffect(() => {
    if (!editingInput) {
      setAmount(formatBigNum(amountToBorrowOrRepay, decimals));
    }
  }, [amountToBorrowOrRepay, decimals, editingInput]);

  return (
    <input
      value={inputValue}
      onChange={(e) => handleInputValueChanged(e.target.value)}
      disabled={amountToBorrowOrRepay.isZero()}
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
