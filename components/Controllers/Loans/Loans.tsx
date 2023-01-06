import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { PaprController } from 'lib/PaprController';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { ControllerPricesData } from 'lib/controllers/charts';
import React, { useMemo } from 'react';
import styles from './Loans.module.css';
import { VaultRow } from './VaultRow';
import { Table } from 'components/Table';
import { VaultHealth } from './VaultHealth';
import { useShowMore } from 'hooks/useShowMore';
import { TextButton } from 'components/Button';
import { erc20ABI, useContractRead } from 'wagmi';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { captureException } from '@sentry/nextjs';
import { controllerNFTValue } from 'lib/controllers';

type LoansProps = {
  paprController: PaprController;
  pricesData: ControllerPricesData | null;
};

export function Loans({ paprController, pricesData }: LoansProps) {
  const maxLTV = useMemo(() => paprController.maxLTVBigNum, [paprController]);
  const activeVaults = useMemo(
    () => paprController.vaults?.filter((v) => v.debt > 0) || [],
    [paprController],
  );
  const oracleInfo = useOracleInfo(OraclePriceType.twap);

  const NFTValue = useMemo(
    () => controllerNFTValue(paprController, oracleInfo),
    [paprController, oracleInfo],
  );

  const { data: totalSupply } = useContractRead({
    abi: erc20ABI,
    address: paprController[
      paprController.token0IsUnderlying ? 'token1' : 'token0'
    ].address as `0x${string}`,
    functionName: 'totalSupply',
  });

  const computedAvg = useMemo(() => {
    if (!totalSupply || !NFTValue || !pricesData) {
      return 0;
    }
    if (!ethers.BigNumber.isBigNumber(totalSupply)) {
      captureException(
        new Error(
          `did not receive BigNumber value for totalSupply: ${totalSupply}`,
        ),
      );
      return 0;
    }
    const { targetValues } = pricesData;
    const target = targetValues[targetValues.length - 1].value;
    const nftValueInPapr = NFTValue / target;

    const totalSupplyNum = parseFloat(ethers.utils.formatEther(totalSupply));
    return totalSupplyNum / nftValueInPapr;
  }, [NFTValue, pricesData, totalSupply]);

  const formattedAvgLtv = useMemo(
    () => formatPercent(computedAvg),
    [computedAvg],
  );

  const formattedTotalDebt = useMemo(() => {
    const debtBigNum = activeVaults.reduce(
      (prev, v) => prev.add(v.debt),
      ethers.BigNumber.from(0),
    );
    const debtNum = parseFloat(
      ethers.utils.formatUnits(debtBigNum, paprController.debtToken.decimals),
    );
    return '$' + formatTokenAmount(debtNum);
  }, [activeVaults, paprController.debtToken]);

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
            <td>
              <VaultHealth ltv={computedAvg} />
            </td>
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
          {feed.map((v) => {
            return <VaultRow key={v.id} vault={v} account={v.account} />;
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
