import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { LendingStrategy } from 'lib/LendingStrategy';
import { convertOneScaledValue } from 'lib/strategies';
import React, { useEffect, useMemo, useState } from 'react';
import { Strategy__factory } from 'types/generated/abis';
import styles from './Loans.module.css';

type LoansProps = {
  lendingStrategy: LendingStrategy;
};

const formatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 2,
});

export function Loans({ lendingStrategy }: LoansProps) {
  const signerOrProvider = useSignerOrProvider();
  const [ltvs, setLtvs] = useState<{ [key: string]: number }>({});
  const norm = useAsyncValue(async () => {
    const s = Strategy__factory.connect(lendingStrategy.id, signerOrProvider);
    return s.newNorm();
  }, [lendingStrategy, signerOrProvider]);
  const activeVaults = useMemo(
    () =>
      lendingStrategy.vaults?.filter((v) => v.totalCollateralValue > 0) || [],
    [lendingStrategy],
  );
  const avgLtv = useMemo(() => {
    const ltvValues = Object.values(ltvs);

    if (ltvValues.length === 0) {
      return '...';
    }

    return formatter.format(
      ltvValues.reduce((a, b) => a + b) / ltvValues.length,
    );
  }, [ltvs]);

  useEffect(() => {
    if (!norm) {
      return;
    }
    const calculatedLtvs = activeVaults.reduce((prev, v) => {
      const l = ltv(v.debt, v.totalCollateralValue, norm);
      return { ...prev, [v.id]: convertOneScaledValue(l, 4) };
    }, {} as { [key: string]: number });
    setLtvs(calculatedLtvs);
  }, [activeVaults, norm]);

  console.log({ activeVaults });

  return (
    <Fieldset legend="💸 Loans">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Total</th>
            <th>Amount</th>
            <th>Days</th>
            <th>Avg. LTV</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.row}>
            <td>{activeVaults.length} Loans</td>
            <td>$1.165M</td>
            <td>???</td>
            <td>{avgLtv}</td>
            <td>???</td>
          </tr>
        </tbody>
      </table>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Loan</th>
            <th>Amount</th>
            <th>Days</th>
            <th>LTV</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody>
          {activeVaults.map((v) => {
            const ltv = ltvs[v.id] ? formatter.format(ltvs[v.id]) : '...';
            return (
              <tr key={v.id} className={styles.row}>
                <td>#{v.id.substring(0, 7)}</td>
                <td>{v.debt}</td>
                <td>???</td>
                <td>{ltv}</td>
                <td>???</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Fieldset>
  );
}

function ltv(
  debt: ethers.BigNumberish,
  totalCollateralValue: ethers.BigNumberish,
  norm: ethers.BigNumberish,
) {
  const valueNormRatio = ethers.BigNumber.from(totalCollateralValue).div(norm);
  return ethers.BigNumber.from(debt).div(valueNormRatio);
}
