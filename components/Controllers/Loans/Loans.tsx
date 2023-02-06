import { captureException } from '@sentry/nextjs';
import { TextButton } from 'components/Button';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useShowMore } from 'hooks/useShowMore';
import { controllerNFTValue } from 'lib/controllers';
import { formatPercent, formatTokenAmount } from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import React, { useMemo } from 'react';
import { erc20ABI, useContractRead } from 'wagmi';

import styles from './Loans.module.css';
import { VaultHealth } from './VaultHealth';
import { VaultRow } from './VaultRow';

export function Loans() {
  const { pricesData } = useControllerPricesData();
  const paprController = useController();
  const currentVaults = useMemo(
    () => paprController.vaults?.filter((v) => v.debt > 0),
    [paprController],
  );
  const oracleInfo = useOracleInfo(OraclePriceType.twap);

  const NFTValue = useMemo(
    () => controllerNFTValue(paprController, oracleInfo),
    [paprController, oracleInfo],
  );

  const { data: totalSupply } = useContractRead({
    abi: erc20ABI,
    address: paprController.paprToken.id as `0x${string}`,
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
    const debtBigNum = (currentVaults || []).reduce(
      (prev, v) => prev.add(v.debt),
      ethers.BigNumber.from(0),
    );
    const debtNum = parseFloat(
      ethers.utils.formatUnits(debtBigNum, paprController.paprToken.decimals),
    );
    return '$' + formatTokenAmount(debtNum);
  }, [currentVaults, paprController.paprToken]);

  const { feed, remainingLength, showMore, amountThatWillShowNext } =
    useShowMore(currentVaults || []);

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
            <td>{currentVaults?.length} Loans</td>
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
