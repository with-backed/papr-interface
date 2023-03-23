import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils.js';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { price } from 'lib/controllers/charts/mark';
import { erc20TokenToToken } from 'lib/uniswapSubgraph';
import { useCallback, useMemo, useState } from 'react';
import {
  SwapActivityByUserDocument,
  SwapActivityByUserQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import { useAccount } from 'wagmi';

import styles from './SwapPositionsPageContent.module.css';

export function SwapPositionsPageContent() {
  const { address } = useAccount();
  const { chainId } = useConfig();
  const { paprToken, token0IsUnderlying, underlying } = useController();
  const price = useLatestMarketPrice();

  const [addressToUse, setAddressToUse] = useState<string | undefined>(address);
  const [timestamps, setTimestamps] = useState<{ start: number; end: number }>({
    start: 0,
    end: 1704067200,
  });

  const { token0, token1 } = useMemo(() => {
    if (token0IsUnderlying)
      return {
        token0: erc20TokenToToken(underlying, chainId),
        token1: erc20TokenToToken(paprToken, chainId),
      };
    else
      return {
        token0: erc20TokenToToken(paprToken, chainId),
        token1: erc20TokenToToken(underlying, chainId),
      };
  }, [token0IsUnderlying, underlying, paprToken, chainId]);

  const [{ data: swapActivityForUserData, fetching }] =
    useQuery<SwapActivityByUserQuery>({
      query: SwapActivityByUserDocument,
      variables: {
        user: addressToUse?.toLowerCase(),
        startTimestamp: useMemo(() => timestamps.start, [timestamps.start]),
        endTimestamp: useMemo(() => timestamps.end, [timestamps.end]),
      },
      pause: !addressToUse,
    });

  const handleAddressToUseUpdated = useCallback(
    (address: string) => {
      setAddressToUse(address);
    },
    [setAddressToUse],
  );
  const handleStartTimestampUpdated = useCallback(
    (start: number) => {
      setTimestamps((t) => ({ ...t, start }));
    },
    [setTimestamps],
  );
  const handleEndTimestampUpdated = useCallback(
    (end: number) => {
      setTimestamps((t) => ({ ...t, end }));
    },
    [setTimestamps],
  );

  const {
    amountPurchased,
    amountSold,
    averageSalePrice,
    averagePurchasePrice,
    averagePurchased,
    averageSold,
    netPapr,
    exitValue,
    magicNumber,
  } = useMemo(() => {
    if (
      !swapActivityForUserData ||
      swapActivityForUserData.activities.length === 0
    )
      return {
        amountPurchased: 0,
        amountSold: 0,
        averageSalePrice: 0,
        averagePurchasePrice: 0,
        averagePurchased: 0,
        averageSold: 0,
        netPapr: 0,
        exitValue: 0,
        magicNumber: 0,
      };

    const sales = swapActivityForUserData.activities.filter(
      (a) => getAddress(a.tokenIn!.id) === getAddress(paprToken.id),
    );
    const amountSold = sales.reduce((a, b) => {
      return ethers.BigNumber.from(a).add(b.amountIn!);
    }, ethers.BigNumber.from(0));
    const amountSoldNum = parseFloat(
      ethers.utils.formatUnits(amountSold, paprToken.decimals),
    );

    const averageSalePrice = computeWeightedAveragePrices(
      sales,
      'amountIn',
      'tokenIn',
      token0IsUnderlying,
      token0,
      token1,
    );

    const purchases = swapActivityForUserData.activities.filter(
      (a) => getAddress(a.tokenOut!.id) === getAddress(paprToken.id),
    );
    const amountPurchased = purchases.reduce((a, b) => {
      return ethers.BigNumber.from(a).add(b.amountOut!);
    }, ethers.BigNumber.from(0));
    const amountPurchasedNum = parseFloat(
      ethers.utils.formatUnits(amountPurchased, paprToken.decimals),
    );
    const averagePurchasePrice = computeWeightedAveragePrices(
      purchases,
      'amountOut',
      'tokenOut',
      token0IsUnderlying,
      token0,
      token1,
    );

    const averagePurchased = amountPurchasedNum * averagePurchasePrice;
    const averageSold = amountSoldNum * averageSalePrice;

    const exitValue = (amountPurchasedNum - amountSoldNum) * (price || 0);

    return {
      amountPurchased: amountPurchasedNum,
      amountSold: amountSoldNum,
      averageSalePrice,
      averagePurchasePrice,
      averagePurchased,
      averageSold,
      netPapr: amountPurchasedNum - amountSoldNum,
      exitValue,
      magicNumber: exitValue - averagePurchased,
    };
  }, [
    swapActivityForUserData,
    paprToken,
    token0IsUnderlying,
    token0,
    token1,
    price,
  ]);

  return (
    <>
      <div>
        <label>Address: </label>
        <input
          type="text"
          value={addressToUse}
          onChange={(e) => handleAddressToUseUpdated(e.target.value)}
        />
      </div>
      <br />
      <div>
        <label>start timestamp: </label>
        <input
          type="number"
          value={timestamps.start}
          onChange={(e) =>
            handleStartTimestampUpdated(parseInt(e.target.value))
          }
        />
      </div>
      <div>
        <label>end timestamp: </label>
        <input
          type="number"
          value={timestamps.end}
          onChange={(e) => handleEndTimestampUpdated(parseInt(e.target.value))}
        />
      </div>
      <br />

      <div className={styles.netContent}>
        <div className={`${styles.col1} ${styles.column}`}>
          <div className={styles.blue}>
            <div>papr bought - papr sold: {netPapr.toFixed(4)} papr</div>
          </div>
          <p>*</p>
          <div className={styles.blue}>
            <div>current papr price: {price} ETH</div>
          </div>

          <p>=</p>
          <div className={styles.blue}>
            {exitValue.toFixed(4)} ETH gain/loss to close papr position
          </div>
        </div>
        <div className={`col2 ${styles.column} `}>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />

          <p> - </p>
        </div>
        <div className={`col3 ${styles.column}`}>
          <div>
            <div className={styles.green}>
              {/* <div>
                {' '}
                {amountPurchased.toFixed(4)} papr purchased *{' '}
                {averagePurchasePrice.toFixed(4)} ETH weighted avg. price
              </div> */}
              <div> {averagePurchased.toFixed(4)} ETH spent on papr</div>
            </div>
            <p>-</p>
            <div className={styles.orange}>
              {/* <div>
                {' '}
                {amountSold.toFixed(4)} papr sold *{' '}
                {averageSalePrice.toFixed(4)} ETH weighted avg. price
              </div> */}
              <div>{averageSold.toFixed(4)} ETH gained from papr sales</div>
            </div>
            <p>=</p>
            <div className={styles.pink}>
              <div>
                {(averagePurchased - averageSold).toFixed(4)} net ETH realized
              </div>
            </div>
          </div>
        </div>
        <div className={`col4 ${styles.column} `}>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <p> = </p>
        </div>
        <div className={`col5 ${styles.column} `}>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <div className={styles.yellow}>
            total unrealized gain/loss:{' '}
            {(exitValue - (averagePurchased - averageSold)).toFixed(4)} ETH (
            {(exitValue / (averagePurchased - averageSold) - 1).toFixed(4)} %)
          </div>
        </div>
      </div>
    </>
  );
}

function computeWeightedAveragePrices(
  swapActivities: SwapActivityByUserQuery['activities'],
  amount: 'amountIn' | 'amountOut',
  token: 'tokenIn' | 'tokenOut',
  token0IsUnderlying: boolean,
  token0: Token,
  token1: Token,
) {
  const amountsNumbers = swapActivities.map((a) => {
    return parseFloat(
      ethers.utils.formatUnits(
        ethers.BigNumber.from(a[amount]),
        a[token]!.decimals,
      ),
    );
  });
  const totalAmount = amountsNumbers.reduce((a, b) => {
    return a + b;
  }, 0);
  const weights = amountsNumbers.map((amount) => {
    return amount / totalAmount;
  });

  return swapActivities
    .map((a, i) => {
      const p = parseFloat(
        price(
          ethers.BigNumber.from(a.sqrtPricePool),
          token0IsUnderlying ? token1 : token0,
          token0IsUnderlying ? token0 : token1,
          token1,
        ).toFixed(4),
      );
      return p * weights[i];
    })
    .reduce((a, b) => a + b, 0);
}
