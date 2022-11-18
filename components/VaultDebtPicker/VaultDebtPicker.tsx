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
  vault: VaultsByOwnerForControllerQuery['vaults']['0'] | undefined;
  collateralContractAddress: string;
  userNFTsForVault: CenterUserNFTsResponse[];
  depositNFTs: string[];
  withdrawNFTs: string[];
  setDepositNFTs: Dispatch<SetStateAction<string[]>>;
  setWithdrawNFTs: Dispatch<SetStateAction<string[]>>;
  setTotalDebtDesired: Dispatch<
    SetStateAction<{ [key: string]: ethers.BigNumber }>
  >;
};

export function VaultDebtPicker({
  paprController,
  vault,
  collateralContractAddress,
  userNFTsForVault,
  depositNFTs,
  withdrawNFTs,
  setDepositNFTs,
  setWithdrawNFTs,
  setTotalDebtDesired,
}: VaultDebtPickerProps) {
  // init hooks
  const { jsonRpcProvider, tokenName } = useConfig();
  const signerOrProvider = useSignerOrProvider();
  const oracleInfo = useOracleInfo();
  const { address } = useAccount();

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
    if (!oracleInfo) return null;
    return paprController.maxDebt([collateralContractAddress], oracleInfo);
  }, [paprController, collateralContractAddress, oracleInfo]);

  const maxDebtPerNFTInUnderlying = useAsyncValue(async () => {
    if (!oracleInfo || !maxDebtPerNFTInPerpetual) return null;
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwap(
      quoter,
      maxDebtPerNFTInPerpetual,
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [
    maxDebtPerNFTInPerpetual,
    jsonRpcProvider,
    tokenName,
    paprController,
    oracleInfo,
  ]);

  const maxDebt = useMemo(() => {
    if (!maxDebtPerNFTInPerpetual) return ethers.BigNumber.from(0);
    return maxDebtPerNFTInPerpetual.mul(numCollateralForMaxDebt);
  }, [maxDebtPerNFTInPerpetual, numCollateralForMaxDebt]);
  const maxDebtNumber = useMemo(() => {
    return parseFloat(
      ethers.utils.formatUnits(maxDebt, paprController.debtToken.decimals),
    );
  }, [maxDebt, paprController.debtToken.decimals]);

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
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwap(
      quoter,
      chosenDebt,
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [
    jsonRpcProvider,
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
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwap(
      quoter,
      debtToBorrowOrRepay,
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [
    usingPerpetual,
    isBorrowing,
    debtToBorrowOrRepay,
    paprController.debtToken.id,
    paprController.underlying.id,
    jsonRpcProvider,
    tokenName,
  ]);

  const underlyingToRepay = useAsyncValue(async () => {
    if (usingPerpetual || isBorrowing || debtToBorrowOrRepay.isZero())
      return ethers.BigNumber.from(0);
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwapOutput(
      quoter,
      debtToBorrowOrRepay,
      paprController.underlying.id,
      paprController.debtToken.id,
    );
  }, [
    isBorrowing,
    usingPerpetual,
    debtToBorrowOrRepay,
    paprController.debtToken.id,
    paprController.underlying.id,
    jsonRpcProvider,
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

  const connectedNFT = useMemo(() => {
    return ERC721__factory.connect(collateralContractAddress, signerOrProvider);
  }, [collateralContractAddress, signerOrProvider]);
  const nftSymbol = useAsyncValue(() => connectedNFT.symbol(), [connectedNFT]);

  const vaultHasDebt = useMemo(() => {
    if (!vault) return false;
    return !ethers.BigNumber.from(vault.debt).isZero();
  }, [vault]);
  const vaultHasCollateral = useMemo(() => {
    if (!vault) return false;
    return vault.collateral.length > 0;
  }, [vault]);

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

  useEffect(() => {
    setTotalDebtDesired((prev) => ({
      ...prev,
      [collateralContractAddress]: chosenDebt,
    }));
  }, [chosenDebt, setTotalDebtDesired, collateralContractAddress]);

  if (!oracleInfo) return <></>;

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
        {!!maxDebtPerNFTInPerpetual && (
          <VaultDebtSlider
            controller={paprController}
            currentVaultDebtNumber={currentVaultDebtNumber}
            maxDebtNumber={maxDebtNumber}
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
            leftText="Borrow More"
            rightText="Repay"
            checked={isBorrowing}
            onChange={() => null}
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
          />
        )}
        {usingPerpetual && !isBorrowing && (
          <RepayPerpetualButton
            amount={amountToBorrowOrRepay}
            collateralContractAddress={collateralContractAddress}
            depositNFTs={depositNFTs}
            withdrawNFTs={withdrawNFTs}
            paprController={paprController}
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
          />
        )}
      </div>
      {/* <div className={styles.slippage}>
        <p>Slippage: 5.03%</p>
      </div> */}
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
  const { jsonRpcProvider, tokenName } = useConfig();
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
        const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
        debtDelta = await getQuoteForSwapOutput(
          quoter,
          ethers.utils.parseUnits(val, decimals),
          paprController.underlying.id,
          paprController.debtToken.id,
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
      jsonRpcProvider,
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
