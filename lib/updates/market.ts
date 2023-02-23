import { getAddress } from 'ethers/lib/utils.js';
import { BLOCKS_IN_A_DAY } from 'hooks/usePoolStats/usePoolStats';
import { TargetUpdate } from 'hooks/useTarget';
import { configs, SupportedToken } from 'lib/config';
import { SECONDS_IN_A_YEAR } from 'lib/constants';
import {
  erc20Contract,
  jsonRpcControllerContract,
  makeProvider,
} from 'lib/contracts';
import { marks } from 'lib/controllers/charts/mark';
import { targets } from 'lib/controllers/charts/target';
import { formatDollars, formatPercent } from 'lib/numberFormat';
import { percentChange } from 'lib/tokenPerformance';
import {
  TargetUpdatesByControllerDocument,
  TargetUpdatesByControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import {
  PoolByIdByBlockDocument,
  PoolByIdByBlockQuery,
  PoolByIdDocument,
  PoolByIdQuery,
  SwapsByPoolDocument,
  SwapsByPoolQuery,
  Token,
} from 'types/generated/graphql/uniswapSubgraph';
import { createClient } from 'urql';

export async function getTargetsInfo(token: SupportedToken) {
  const provider = makeProvider(configs[token].jsonRpcProvider, token);
  const currentBlock = await provider.getBlock('latest');

  const newTarget = await jsonRpcControllerContract(
    configs[token].controllerAddress,
    token,
  ).newTarget({ blockTag: currentBlock.number });

  const underlyingDecimals = await erc20Contract(
    configs[token].underlyingAddress,
    token,
  ).decimals();
  const targetUpdate: TargetUpdate = {
    newTarget,
    timestamp: currentBlock.timestamp,
  };
  const graphQLClient = createClient({
    url: configs[token].paprSubgraph,
  });
  const res = await graphQLClient
    .query<TargetUpdatesByControllerQuery>(TargetUpdatesByControllerDocument, {
      controller: configs[token].controllerAddress,
    })
    .toPromise();

  if (res.error) {
    throw new Error(res.error.message);
  }

  const targetValues = targets(
    res.data?.targetUpdates || [],
    targetUpdate,
    underlyingDecimals,
  );
  const l = targetValues.length;

  const cur = targetValues[l - 1];
  const prev = targetValues[l - 2];
  const change = percentChange(prev.value, cur.value);
  const apr = (change / (cur.time - prev.time)) * SECONDS_IN_A_YEAR;

  // find the target update whose time is closest to an hour ago
  const hourAgo = currentBlock.timestamp - 3600;
  const targetHourAgo = targetValues.reduce((prev, curr) => {
    return Math.abs(curr.time - hourAgo) < Math.abs(prev.time - hourAgo)
      ? curr
      : prev;
  });
  const targetPercentChange = percentChange(targetHourAgo.value, cur.value);
  const direction = targetPercentChange > 0 ? '+' : '-';
  return {
    currentTarget: cur.value,
    apr: formatPercent(apr),
    targetPercentChange: `${direction}${formatPercent(targetPercentChange)}`,
    targetHourAgo,
  };
}

export async function getUniswapPoolInfo(token: SupportedToken) {
  const provider = makeProvider(configs[token].jsonRpcProvider, token);
  const currentBlock = await provider.getBlock('latest');

  const graphQLClient = createClient({
    url: configs[token].uniswapSubgraph,
  });

  const currentPoolRes = await graphQLClient
    .query<PoolByIdQuery>(PoolByIdDocument, {
      id: configs[token].uniswapPoolAddress,
    })
    .toPromise();
  const pool = currentPoolRes.data?.pool;
  if (currentPoolRes.error || !pool) {
    throw new Error(currentPoolRes?.error?.message);
  }
  const baseCurrency =
    getAddress(configs[token].underlyingAddress) == getAddress(pool.token0.id)
      ? (pool.token1 as Token)
      : (pool.token0 as Token);
  const quoteCurrency =
    getAddress(configs[token].underlyingAddress) == getAddress(pool.token0.id)
      ? (pool.token0 as Token)
      : (pool.token1 as Token);

  const volumeUSD = currentPoolRes.data?.pool?.volumeUSD || 0;

  const poolYesterdayRes = await graphQLClient
    .query<PoolByIdByBlockQuery>(PoolByIdByBlockDocument, {
      id: configs[token].uniswapPoolAddress,
      blockHeight: currentBlock.number - BLOCKS_IN_A_DAY,
    })
    .toPromise();

  if (poolYesterdayRes.error) {
    throw new Error(poolYesterdayRes.error.message);
  }
  const volumeUSDYesterday = poolYesterdayRes.data?.pool?.volumeUSD || 0;

  const volume24h = formatDollars(
    parseFloat(volumeUSD) - parseFloat(volumeUSDYesterday),
  );
  const swapsRes = await graphQLClient
    .query<SwapsByPoolQuery>(SwapsByPoolDocument, {
      pool: configs[token].uniswapPoolAddress,
    })
    .toPromise();
  if (swapsRes.error) {
    throw new Error(swapsRes.error.message);
  }

  const swaps = swapsRes.data?.swaps || [];
  const markValues = marks(
    swaps,
    baseCurrency,
    quoteCurrency,
    pool.token0 as Token,
  );

  const mark = markValues[markValues.length - 1];

  // find the mark whose time is closest to an hour ago
  const hourAgo = currentBlock.timestamp - 3600;
  const markHourAgo = markValues.reduce((prev, curr) => {
    return Math.abs(curr.time - hourAgo) < Math.abs(prev.time - hourAgo)
      ? curr
      : prev;
  });
  const markPercentChange = percentChange(markHourAgo.value, mark.value);
  const direction = markPercentChange > 0 ? '+' : '-';

  return {
    mark: mark.value,
    markPercentChange: `${direction}${formatPercent(markPercentChange)}`,
    markHourAgo,
    volume24h,
  };
}
