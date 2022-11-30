import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { PaprController } from 'lib/PaprController';
import {
  formatBigNum,
  formatPercent,
  formatTokenAmount,
} from 'lib/numberFormat';
import { computeLtv, convertOneScaledValue } from 'lib/controllers';
import { ControllerPricesData } from 'lib/controllers/charts';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './Loans.module.css';
import { VaultRow } from './VaultRow';
import { Table } from 'components/Table';
import { VaultHealth } from './VaultHealth';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { OraclePriceType } from 'lib/oracle/reservoir';

type LoansProps = {
  paprController: PaprController;
  pricesData: ControllerPricesData | null;
};

export function Loans({ paprController, pricesData }: LoansProps) {
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const [ltvs, setLtvs] = useState<{ [key: string]: number }>({});
  const norm = useAsyncValue(
    () => paprController.newTarget(),
    [paprController],
  );
  const maxLTV = useAsyncValue(() => paprController.maxLTV(), [paprController]);
  const activeVaults = useMemo(
    () => paprController.vaults?.filter((v) => v.debt > 0) || [],
    [paprController],
  );
  const avgLtv = useMemo(() => {
    const ltvValues = Object.values(ltvs);

    if (ltvValues.length === 0) {
      return 0;
    }
    return ltvValues.reduce((a, b) => a + b) / ltvValues.length;
  }, [ltvs]);

  const formattedAvgLtv = useMemo(() => formatPercent(avgLtv), [avgLtv]);

  const formattedTotalDebt = useMemo(() => {
    const debtBigNum = activeVaults.reduce(
      (prev, v) => prev.add(v.debt),
      ethers.BigNumber.from(0),
    );
    const debtNum = parseFloat(
      ethers.utils.formatUnits(debtBigNum, paprController.underlying.decimals),
    );
    return '$' + formatTokenAmount(debtNum);
  }, [activeVaults, paprController.underlying]);

  const computedLtvs: { [key: string]: number } | null =
    useAsyncValue(async () => {
      if (!oracleInfo || !maxLTV) return null;
      return await activeVaults.reduce(async (prev, v) => {
        const maxDebtForVault: ethers.BigNumber = (
          await paprController.maxDebt([v.collateralContract], oracleInfo)
        ).mul(v.collateral.length);
        const maxNumber = parseFloat(
          formatBigNum(maxDebtForVault, paprController.debtToken.decimals),
        );
        const debtNumber = parseFloat(
          formatBigNum(v.debt, paprController.debtToken.decimals),
        );

        return {
          ...prev,
          [v.id]:
            (debtNumber / maxNumber) *
            parseFloat(ethers.utils.formatEther(maxLTV)),
        };
      }, {});
    }, [activeVaults, oracleInfo, paprController, maxLTV]);

  useEffect(() => {
    if (!norm) {
      return;
    }
    const calculatedLtvs = activeVaults.reduce((prev, v) => {
      // TODO fix after we decide how get up to date oracle quote
      const l = computeLtv(v.debt, 1, norm);
      return { ...prev, [v.id]: convertOneScaledValue(l, 4) };
    }, {} as { [key: string]: number });
    setLtvs(calculatedLtvs);
  }, [activeVaults, norm]);

  const formattedDebts = useMemo(() => {
    const decimals = paprController.underlying.decimals;
    const debts = activeVaults.map(
      (v) =>
        '$' +
        formatTokenAmount(
          parseFloat(ethers.utils.formatUnits(v.debt, decimals)),
        ),
    );
    const longestDebt = debts.reduce((prev, curr) =>
      prev.length > curr.length ? prev : curr,
    );
    return debts.map((d) => d.padStart(longestDebt.length, ' '));
  }, [activeVaults, paprController.underlying.decimals]);

  return (
    <Fieldset legend="💸 Loans">
      <Table className={styles.table} fixed>
        <thead>
          <tr>
            <th>Total</th>
            <th>Amount</th>
            <th>Avg.LTV</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.row}>
            <td>{activeVaults.length} Loans</td>
            <td>{formattedTotalDebt}</td>
            <td>{formattedAvgLtv}</td>
            <td>{!!maxLTV && <VaultHealth ltv={avgLtv} maxLtv={maxLTV} />}</td>
          </tr>
        </tbody>
      </Table>
      <Table className={styles.table} fixed>
        <thead>
          <tr>
            <th>Loan</th>
            <th>Amount</th>
            <th>LTV</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody>
          {activeVaults.map((v, i) => {
            const ltv = computedLtvs ? computedLtvs[v.id] : 0;
            const formattedDebt = formattedDebts[i];
            return (
              <VaultRow
                key={v.account}
                id={v.id}
                account={v.account}
                debt={formattedDebt}
                controllerId={paprController.id}
                ltv={ltv}
                maxLTV={maxLTV}
              />
            );
          })}
        </tbody>
      </Table>
    </Fieldset>
  );
}
