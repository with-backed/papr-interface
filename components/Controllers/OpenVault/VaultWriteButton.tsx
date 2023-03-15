import { TransactionButton } from 'components/Button';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useController } from 'hooks/useController';
import { useOracleSynced } from 'hooks/useOracleSynced';
import { usePaprBalance } from 'hooks/usePaprBalance';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { VaultWriteType } from 'hooks/useVaultWrite/helpers';
import { useVaultWrite } from 'hooks/useVaultWrite/useVaultWrite';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { useEffect, useMemo, useState } from 'react';
import { ERC20__factory } from 'types/generated/abis';
import { useAccount } from 'wagmi';

import { ApproveNFTButton } from '../ApproveButtons/ApproveNFTButton';
import { ApproveTokenButton } from '../ApproveButtons/ApproveTokenButton';

type VaultWriteButtonProps = {
  writeType: VaultWriteType;
  collateralContractAddress: string;
  depositNFTs: string[];
  withdrawNFTs: string[];
  amount: ethers.BigNumber;
  quote: ethers.BigNumber | null;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
  refresh: () => void;
};

export function VaultWriteButton({
  writeType,
  collateralContractAddress,
  depositNFTs,
  withdrawNFTs,
  amount,
  quote,
  errorMessage,
  setErrorMessage,
  refresh,
}: VaultWriteButtonProps) {
  const { address } = useAccount();
  const signerOrProvider = useSignerOrProvider();
  const paprController = useController();
  const oracleInfoSynced = useOracleSynced(
    collateralContractAddress,
    OraclePriceType.lower,
  );

  const [collateralApproved, setCollateralApproved] = useState<boolean>(false);
  const [underlyingApproved, setUnderlyingApproved] = useState<boolean>(false);
  const [debtTokenApproved, setDebtTokenApproved] = useState<boolean>(false);

  const usingSafeTransferFrom = useMemo(() => {
    if (
      depositNFTs.length === 1 &&
      withdrawNFTs.length === 0 &&
      (writeType === VaultWriteType.Borrow ||
        writeType === VaultWriteType.BorrowWithSwap)
    )
      return true;
    else return false;
  }, [depositNFTs.length, withdrawNFTs.length, writeType]);

  const disabled = useMemo(() => {
    if (!oracleInfoSynced) return true;
    switch (writeType) {
      case VaultWriteType.Borrow:
        return (
          !usingSafeTransferFrom &&
          !collateralApproved &&
          depositNFTs.length > 0
        );
      case VaultWriteType.BorrowWithSwap:
        return (
          (!usingSafeTransferFrom &&
            !collateralApproved &&
            depositNFTs.length > 0) ||
          !quote
        );
      case VaultWriteType.Repay:
        return !!errorMessage || !debtTokenApproved;
      case VaultWriteType.RepayWithSwap:
        return !!errorMessage || !underlyingApproved || !quote;
    }
  }, [
    oracleInfoSynced,
    depositNFTs,
    writeType,
    usingSafeTransferFrom,
    underlyingApproved,
    collateralApproved,
    debtTokenApproved,
    errorMessage,
    quote,
  ]);

  const buttonText = useMemo(() => {
    if (!oracleInfoSynced) return 'Waiting for oracle...';
    let actions: string[] = [];
    if (depositNFTs.length > 0) actions = [...actions, 'Deposit'];
    if (withdrawNFTs.length > 0) actions = [...actions, 'Withdraw'];
    actions = [
      ...actions,
      writeType === VaultWriteType.Repay ||
      writeType === VaultWriteType.RepayWithSwap
        ? 'Repay'
        : 'Borrow',
    ];
    if (actions.length > 2) return 'Update Loan';
    else if (actions.length > 1) return actions.join(' & ');
    else return actions[0];
  }, [oracleInfoSynced, depositNFTs.length, withdrawNFTs.length, writeType]);

  const { data, write, error } = useVaultWrite(
    writeType,
    collateralContractAddress,
    depositNFTs,
    withdrawNFTs,
    amount,
    quote,
    usingSafeTransferFrom,
    disabled,
    refresh,
  );

  const underlyingBalance = useAsyncValue(async () => {
    if (!address) return null;
    return ERC20__factory.connect(
      paprController.underlying.id,
      signerOrProvider,
    ).balanceOf(address);
  }, [paprController.underlying.id, signerOrProvider, address]);
  const { balance: debtTokenBalance } = usePaprBalance(
    paprController.paprToken.id,
  );

  useEffect(() => {
    if (!underlyingBalance || !debtTokenBalance) {
      setErrorMessage('');
      return;
    }
    if (
      writeType === VaultWriteType.Borrow ||
      writeType === VaultWriteType.BorrowWithSwap
    ) {
      setErrorMessage('');
      return;
    }
    if (writeType === VaultWriteType.Repay) {
      setErrorMessage(
        debtTokenBalance.lt(amount)
          ? `Insufficient ${paprController.paprToken.symbol} balance`
          : '',
      );
      return;
    }
    if (writeType === VaultWriteType.RepayWithSwap && !!quote) {
      setErrorMessage(
        underlyingBalance.lt(quote)
          ? `Insufficient ${paprController.underlying.symbol} balance`
          : '',
      );
      return;
    }

    setErrorMessage('');
  }, [
    writeType,
    setErrorMessage,
    paprController.paprToken.symbol,
    paprController.underlying.symbol,
    underlyingBalance,
    debtTokenBalance,
    amount,
    quote,
  ]);

  return (
    <>
      {!usingSafeTransferFrom && depositNFTs.length > 0 && (
        <ApproveNFTButton
          collateralContractAddress={collateralContractAddress}
          approved={collateralApproved}
          setApproved={setCollateralApproved}
        />
      )}
      {writeType === VaultWriteType.Repay && (
        <ApproveTokenButton
          token={paprController.paprToken}
          tokenApproved={debtTokenApproved}
          setTokenApproved={setDebtTokenApproved}
        />
      )}
      {writeType === VaultWriteType.RepayWithSwap && (
        <ApproveTokenButton
          token={paprController.underlying}
          tokenApproved={underlyingApproved}
          setTokenApproved={setUnderlyingApproved}
        />
      )}
      <TransactionButton
        kind="regular"
        size="small"
        theme="papr"
        onClick={write!}
        transactionData={data}
        error={error?.message}
        text={buttonText}
        disabled={disabled}
      />
    </>
  );
}
