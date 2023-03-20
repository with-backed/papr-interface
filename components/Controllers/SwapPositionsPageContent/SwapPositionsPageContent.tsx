import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils.js';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { price } from 'lib/controllers/charts/mark';
import { erc20TokenToToken } from 'lib/uniswapSubgraph';
import { useMemo } from 'react';
import {
  SwapActivityByUserDocument,
  SwapActivityByUserQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import { useAccount } from 'wagmi';

export function SwapPositionsPageContent() {
  const { address } = useAccount();
  const { chainId } = useConfig();
  const { paprToken, token0IsUnderlying, underlying } = useController();
  const price = useLatestMarketPrice();

  const { token0, token1 } = useMemo(() => {
    if (token0IsUnderlying)
      return {
        token0: erc20TokenToToken(underlying, chainId),
        token1: erc20TokenToToken(paprToken, chainId),
      };
    else
      return {
        token0: erc20TokenToToken(paprToken, chainId),
        token1: erc20TokenToToken(paprToken, chainId),
      };
  }, [token0IsUnderlying, underlying, paprToken, chainId]);

  const [{ data: swapActivityForUserData, fetching }] =
    useQuery<SwapActivityByUserQuery>({
      query: SwapActivityByUserDocument,
      variables: {
        user: address?.toLowerCase(),
      },
      pause: !address,
    });

  const {
    amountPurchased,
    amountSold,
    averageSalePrice,
    averagePurchasePrice,
  } = useMemo(() => {
    if (!swapActivityForUserData)
      return {
        amountPurchased: 0,
        amountSold: 0,
        averageSalePrice: 0,
        averagePurchasePrice: 0,
      };

    const sales = swapActivityForUserData.activities.filter(
      (a) => getAddress(a.tokenIn!.id) === getAddress(paprToken.id),
    );
    console.log({
      sales,
    });
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
    console.log({
      purchases,
    });
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

    return {
      amountPurchased: amountPurchasedNum,
      amountSold: amountSoldNum,
      averageSalePrice,
      averagePurchasePrice,
    };
  }, [swapActivityForUserData, paprToken, token0IsUnderlying, token0, token1]);

  return (
    <>
      <div>amount sold: {amountSold.toFixed(4)} papr</div>
      <div>average sale price: {averageSalePrice.toFixed(4)} ETH</div>
      <div>average sold: {(amountSold * averageSalePrice).toFixed(4)} ETH</div>
      <div>amount purchased: {amountPurchased.toFixed(4)} papr</div>
      <div>average purchase price: {averagePurchasePrice.toFixed(4)} ETH</div>
      <div>
        average purchased: {(amountPurchased * averagePurchasePrice).toFixed(4)}{' '}
        ETH
      </div>
      <div>net papr: {(amountPurchased - amountSold).toFixed(4)} papr</div>
      <div>current papr price: {price} ETH</div>
      <div>
        exit value: {((amountPurchased - amountSold) * (price || 0)).toFixed(4)}{' '}
        ETH
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
    .reduce((a, b) => a + b);
}
