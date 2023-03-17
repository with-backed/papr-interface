import { TextButton } from 'components/Button';
import { Fieldset } from 'components/Fieldset';
import { HealthBar } from 'components/HealthBar';
import { Table } from 'components/Table';
import { Tooltip } from 'components/Tooltip';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useShowMore } from 'hooks/useShowMore';
import { controllerNFTValue, convertOneScaledValue } from 'lib/controllers';
import { formatTokenAmount } from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import React, { useMemo } from 'react';
import { TooltipReference, useTooltipState } from 'reakit/Tooltip';
import { erc20ABI, useContractRead } from 'wagmi';

import styles from './Loans.module.css';
import { VaultRow } from './VaultRow';

export function Loans() {
  const { pricesData } = useControllerPricesData();
  const paprController = useController();
  const currentVaults = useMemo(
    () =>
      paprController.vaults?.filter((v) => v.debt > 0 && v.collateralCount > 0),
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

  const totalNumberOfNFTsInVaults = useMemo(
    () =>
      currentVaults?.reduce((acc, v) => acc + v.collateralCount, 0) || '...',
    [currentVaults],
  );

  const borrowedTooltip = useTooltipState();
  const marketPrice = useLatestMarketPrice();

  const totalNumberOfBorrowers = useMemo(() => {
    const borrowers = new Set(currentVaults?.map((v) => v.account));
    return borrowers.size;
  }, [currentVaults]);

  const computedAvg = useMemo(() => {
    if (
      !totalSupply ||
      !NFTValue ||
      !pricesData ||
      pricesData.targetValues.length === 0
    ) {
      return 0;
    }
    const { targetValues } = pricesData;
    const target = targetValues[targetValues.length - 1].value;
    const nftValueInPapr = NFTValue / target;

    const totalSupplyNum = parseFloat(ethers.utils.formatEther(totalSupply));
    return totalSupplyNum / nftValueInPapr;
  }, [NFTValue, pricesData, totalSupply]);

  const aggregateLTVMaxRatio = useMemo(() => {
    const formattedMaxLTV = convertOneScaledValue(
      ethers.BigNumber.from(paprController.maxLTV),
      4,
    );
    return computedAvg / formattedMaxLTV;
  }, [computedAvg, paprController]);

  const formattedTotalDebt = useMemo(() => {
    const debtBigNum = (currentVaults || []).reduce(
      (prev, v) => prev.add(v.debt),
      ethers.BigNumber.from(0),
    );
    const debtNum = parseFloat(
      ethers.utils.formatUnits(debtBigNum, paprController.paprToken.decimals),
    );
    return formatTokenAmount(debtNum);
  }, [currentVaults, paprController.paprToken]);

  const { feed, remainingLength, showMore, amountThatWillShowNext } =
    useShowMore(currentVaults || []);

  return (
    <Fieldset legend="💸 Loans">
      <Table className={styles.table} fixed>
        <col className={styles['first-column']} />
        <thead>
          <tr>
            <th className={styles.nfts}>NFTs</th>
            <th>Borrowers</th>
            <th>
              Borrowed
              <br />
              <span className={styles.lowercase}>(paprmeme)</span>
            </th>
            <th>
              Utilization
              <br />
              <span className={styles.lowercase}>(up to max LTV)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.row}>
            <td className={styles.nfts}>{totalNumberOfNFTsInVaults}</td>
            <td>{totalNumberOfBorrowers}</td>
            <td>
              <TooltipReference {...borrowedTooltip}>
                {formattedTotalDebt}
              </TooltipReference>
              <Tooltip {...borrowedTooltip}>
                {!!marketPrice && (
                  <span>
                    {formatTokenAmount(
                      marketPrice * parseFloat(formattedTotalDebt),
                    )}{' '}
                    ETH
                  </span>
                )}
                {!marketPrice && '...'}
              </Tooltip>
            </td>
            <td>
              <HealthBar ratio={aggregateLTVMaxRatio} />
            </td>
          </tr>
        </tbody>
      </Table>
      <Table className={styles.table} fixed>
        <col className={styles['first-column']} />
        <thead>
          <tr>
            <th />
            <th>Borrower</th>
            <th />
            <th />
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
