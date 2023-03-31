import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { slot0Abi } from 'hooks/useSlot0';
import { useTimestamp } from 'hooks/useTimestamp';
import { price } from 'lib/controllers/charts/mark';
import { erc20TokenToToken } from 'lib/uniswapSubgraph';
import { useEffect, useMemo, useState } from 'react';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';
import { useContractRead } from 'wagmi';

export function usePaprPriceForAuction(
  auction: NonNullable<AuctionQuery['auction']>,
) {
  const { chainId } = useConfig();
  const { poolAddress, underlying, paprToken, token0IsUnderlying } =
    useController();
  const latestMarketPrice = useLatestMarketPrice();
  const timestampResult = useTimestamp();

  const [paprPrice, setPaprPrice] = useState<number | null>(null);
  const [paprPriceLoading, setPaprPriceLoading] = useState<boolean>(true);

  const auctionCompleted = useMemo(() => {
    return !!auction.end;
  }, [auction]);

  const { baseToken, quoteToken } = useMemo(() => {
    const underlyingUniswapToken = erc20TokenToToken(underlying, chainId);
    const paprUniswapToken = erc20TokenToToken(paprToken, chainId);

    return token0IsUnderlying
      ? {
          baseToken: underlyingUniswapToken,
          quoteToken: paprUniswapToken,
        }
      : {
          baseToken: paprUniswapToken,
          quoteToken: underlyingUniswapToken,
        };
  }, [token0IsUnderlying, underlying, paprToken, chainId]);

  const blockForSlot0Read = useMemo(() => {
    if (!timestampResult || !auctionCompleted) return undefined;
    const difference = timestampResult.timestamp - auction.end!.timestamp;
    const blocksElapsed = Math.floor(difference / 12);
    return timestampResult.blockNumber - blocksElapsed;
  }, [timestampResult, auctionCompleted, auction.end]);

  const { data: poolData } = useContractRead({
    // skip query if the auction is not completed, or we're waiting for the timestamp
    address: blockForSlot0Read ? (poolAddress as `0x${string}`) : undefined,
    abi: slot0Abi,
    functionName: 'slot0',
    overrides: {
      blockTag: blockForSlot0Read,
    },
  });

  useEffect(() => {
    if (auctionCompleted) {
      if (!poolData) return;
      const ethPriceFromSlot0 = price(
        poolData.sqrtPriceX96,
        baseToken,
        quoteToken,
        baseToken,
      );
      setPaprPrice(parseFloat(ethPriceFromSlot0.toFixed()));
      setPaprPriceLoading(false);
    } else {
      if (!latestMarketPrice) return;
      setPaprPrice(latestMarketPrice);
      setPaprPriceLoading(false);
    }
  }, [auctionCompleted, poolData, latestMarketPrice, baseToken, quoteToken]);

  return { paprPrice, paprPriceLoading };
}
