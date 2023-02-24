import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils.js';
import { configs, SupportedToken } from 'lib/config';
import {
  BLOCKS_IN_A_DAY,
  BLOCKS_IN_A_HOUR,
  SECONDS_IN_A_YEAR,
} from 'lib/constants';
import {
  erc20Contract,
  jsonRpcControllerContract,
  makeProvider,
} from 'lib/contracts';
import { marks } from 'lib/controllers/charts/mark';
import { formatDollars, formatPercent } from 'lib/numberFormat';
import { percentChange } from 'lib/tokenPerformance';
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
  const blockAnHourAgo = await provider.getBlock(
    currentBlock.number - BLOCKS_IN_A_HOUR,
  );
  const controllerContract = jsonRpcControllerContract(
    configs[token].controllerAddress,
    token,
  );

  const underlyingDecimals = await erc20Contract(
    configs[token].underlyingAddress,
    token,
  ).decimals();

  const currentTarget = parseFloat(
    ethers.utils.formatUnits(
      await controllerContract.target({ blockTag: currentBlock.number }),
      underlyingDecimals,
    ),
  );
  const targetLastUpdated = (await controllerContract.lastUpdated()).toNumber();

  const newTarget = parseFloat(
    ethers.utils.formatUnits(
      await jsonRpcControllerContract(
        configs[token].controllerAddress,
        token,
      ).newTarget({ blockTag: currentBlock.number }),
      underlyingDecimals,
    ),
  );
  const targetHourAgo = parseFloat(
    ethers.utils.formatUnits(
      await jsonRpcControllerContract(
        configs[token].controllerAddress,
        token,
      ).newTarget({ blockTag: blockAnHourAgo.number }),
      underlyingDecimals,
    ),
  );

  const targetChange = percentChange(currentTarget, newTarget);
  const apr =
    (targetChange / (currentBlock.timestamp - targetLastUpdated)) *
    SECONDS_IN_A_YEAR;

  const hourlyTargetChange = percentChange(targetHourAgo, newTarget);

  return {
    target: newTarget.toFixed(4),
    apr: formatPercent(apr),
    targetPercentChange: formatPercent(hourlyTargetChange),
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

  return {
    mark: mark.value.toFixed(4),
    markPercentChange: formatPercent(markPercentChange),
    volume24h,
  };
}
