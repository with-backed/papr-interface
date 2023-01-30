import { ethers } from 'ethers';
import { TransactionButton } from 'components/Button';
import { useVaultWrite } from 'hooks/useVaultWrite/useVaultWrite';
import { VaultWriteType } from 'hooks/useVaultWrite/helpers';

type VaultWriteButtonProps = {
  writeType: VaultWriteType;
  collateralContractAddress: string;
  depositNFTs: string[];
  withdrawNFTs: string[];
  amount: ethers.BigNumber;
  quote: ethers.BigNumber | null;
  vaultHasDebt: boolean;
  disabled: boolean;
  refresh: () => void;
};

export function VaultWriteButton({
  writeType,
  collateralContractAddress,
  depositNFTs,
  withdrawNFTs,
  amount,
  quote,
  vaultHasDebt,
  disabled,
  refresh,
}: VaultWriteButtonProps) {
  const { data, write, error } = useVaultWrite(
    writeType,
    collateralContractAddress,
    depositNFTs,
    withdrawNFTs,
    amount,
    quote,
    refresh,
  );

  return (
    <TransactionButton
      kind="regular"
      size="small"
      theme="papr"
      onClick={write!}
      transactionData={data}
      error={error?.message}
      text={vaultHasDebt ? 'Update Loan' : 'Borrow'}
      disabled={disabled}
    />
  );
}
