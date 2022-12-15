import { BigNumber } from '@ethersproject/bignumber';
import { TextButton } from 'components/Button';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { ethers } from 'ethers';
import { useLTVs } from 'hooks/useLTVs/useLTVs';
import { useShowMore } from 'hooks/useShowMore';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { PaprController } from 'lib/PaprController';
import { useMemo } from 'react';

import styles from './Loans.module.css';
import { VaultHealth } from './VaultHealth';
import { VaultRow } from './VaultRow';

type LoansProps = {
  paprController: PaprController;
};

export function Loans({ paprController }: LoansProps) {
  const maxLTV = useMemo(() => paprController.maxLTVBigNum, [paprController]);
  const activeVaults = useMemo(
    () => paprController.vaults?.filter((v) => v.debt > 0) || [],
    [paprController],
  );

  const { ltvs } = useLTVs(paprController, activeVaults, maxLTV);

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
      BigNumber.from(0),
    );
    const debtNum = parseFloat(
      ethers.utils.formatUnits(debtBigNum, paprController.debtToken.decimals),
    );
    return '$' + formatTokenAmount(debtNum);
  }, [activeVaults, paprController.debtToken]);

  const formattedDebts = useMemo(() => {
    const decimals = paprController.debtToken.decimals;
    const debts = activeVaults.map(
      (v) =>
        '$' +
        formatTokenAmount(
          parseFloat(ethers.utils.formatUnits(v.debt, decimals)),
        ),
    );
    return debts;
  }, [activeVaults, paprController.debtToken.decimals]);

  const { feed, remainingLength, showMore, amountThatWillShowNext } =
    useShowMore(activeVaults);

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
          {feed.map((v, i) => {
            // TODO: I'm sure there was a reason we calculated all of the LTVs
            // as a big block, but now that we're only rendering a subset at
            // a time, we should also defer calculating LTVs for the hidden ones.
            const ltv = ltvs ? ltvs[v.id] : 0;
            const formattedDebt = formattedDebts[i];
            return (
              <VaultRow
                key={v.id}
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
      {remainingLength > 0 && (
        <div className={styles['button-container']}>
          <TextButton kind="clickable" onClick={showMore}>
            Load {amountThatWillShowNext} more (of {remainingLength})
          </TextButton>
        </div>
      )}
    </Fieldset>
  );
}
