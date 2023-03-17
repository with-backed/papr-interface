import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils.js';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { price } from 'lib/controllers/charts/mark';
import { erc20TokenToToken } from 'lib/uniswapSubgraph';
import { useEffect, useMemo, useState } from 'react';
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

  const [averageSalePrice, setAverageSalePrice] = useState<number>(0);
  const [averagePurchasePrice, setAveragePurchasePrice] = useState<number>(0);

  const [{ data: swapActivityForUserData, fetching }] =
    useQuery<SwapActivityByUserQuery>({
      query: SwapActivityByUserDocument,
      variables: {
        user: address?.toLowerCase(),
      },
      pause: !address,
    });

  useEffect(() => {
    if (!swapActivityForUserData) return;

    const sales = swapActivityForUserData.activities.filter(
      (a) => getAddress(a.tokenIn!.id) === getAddress(paprToken.id),
    );
    console.log({ sales });

    const averageSalePrice =
      sales
        .map((s) => {
          console.log({
            price: parseFloat(
              price(
                ethers.BigNumber.from(s.sqrtPricePool),
                token0IsUnderlying ? token1 : token0,
                token0IsUnderlying ? token0 : token1,
                token1,
              ).toFixed(4),
            ),
          });
          return parseFloat(
            price(
              ethers.BigNumber.from(s.sqrtPricePool),
              token0IsUnderlying ? token1 : token0,
              token0IsUnderlying ? token0 : token1,
              token1,
            ).toFixed(4),
          );
        })
        .reduce((a, b) => a + b) / sales.length;
    setAverageSalePrice(averageSalePrice);
  }, [swapActivityForUserData, paprToken, token0IsUnderlying, token0, token1]);

  return <div>{averageSalePrice}</div>;
}
