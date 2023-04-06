import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { formatBigNum } from 'lib/numberFormat';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from 'reakit';

import styles from './VaultDebtPicker/VaultDebtPicker.module.css';

type AmountToBorrowOrRepayInputProps = {
  isBorrowing: boolean;
  currentVaultDebt: ethers.BigNumber;
  debtToBorrowOrRepay: ethers.BigNumber;
  setControlledSliderValue: (val: number) => void;
  setChosenDebt: (val: ethers.BigNumber) => void;
};

export function AmountToBorrowOrRepayInput({
  isBorrowing,
  currentVaultDebt,
  debtToBorrowOrRepay,
  setControlledSliderValue,
  setChosenDebt,
}: AmountToBorrowOrRepayInputProps) {
  const paprController = useController();
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
