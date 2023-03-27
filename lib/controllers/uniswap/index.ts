import {
  CurrencyAmount,
  Token,
  Token as UniswapToken,
} from '@uniswap/sdk-core';
import { Pool, SqrtPriceMath, TickMath } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import { PaprController } from 'hooks/useController';
import JSBI from 'jsbi';
import { ERC20Token } from 'lib/controllers/index';
import { erc20TokenToToken } from 'lib/uniswapSubgraph';
import { IUniswapV3Pool } from 'types/generated/abis';
import { ActivityByControllerQuery } from 'types/generated/graphql/inKindSubgraph';

// const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/<YOUR-ENDPOINT-HERE>')

// const poolAddress = '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8'

// const poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolABI, provider)

interface Immutables {
  factory: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  maxLiquidityPerTick: ethers.BigNumber;
}

interface State {
  liquidity: ethers.BigNumber;
  sqrtPriceX96: ethers.BigNumber;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}

async function getPoolImmutables(poolContract: IUniswapV3Pool) {
  const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] =
    await Promise.all([
      poolContract.factory(),
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.maxLiquidityPerTick(),
    ]);

  const immutables: Immutables = {
    factory,
    token0,
    token1,
    fee,
    tickSpacing,
    maxLiquidityPerTick,
  };
  return immutables;
}

export async function getPoolState(poolContract: IUniswapV3Pool) {
  const [liquidity, slot] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  const PoolState: State = {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  };

  return PoolState;
}

export async function getPool(
  poolContract: IUniswapV3Pool,
  token0: ERC20Token,
  token1: ERC20Token,
  chainId: number,
): Promise<Pool> {
  const [immutables, state] = await Promise.all([
    getPoolImmutables(poolContract),
    getPoolState(poolContract),
  ]);

  const TokenA = new UniswapToken(
    chainId,
    immutables.token0,
    token0.decimals,
    token0.symbol,
    token0.name,
  );

  const TokenB = new UniswapToken(
    chainId,
    immutables.token1,
    token1.decimals,
    token1.symbol,
    token1.name,
  );

  return new Pool(
    TokenA,
    TokenB,
    immutables.fee,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    state.tick,
  );
}

export function getAmount0FromLPStats(
  token0: Token,
  sqrtPriceX96: ethers.BigNumber,
  tickCurrent: number,
  tickLower: number,
  tickUpper: number,
  liquidity: ethers.BigNumber,
): ethers.BigNumber {
  let currentAmount: CurrencyAmount<Token>;

  if (tickCurrent < tickLower) {
    currentAmount = CurrencyAmount.fromRawAmount(
      token0,
      SqrtPriceMath.getAmount0Delta(
        TickMath.getSqrtRatioAtTick(tickLower),
        TickMath.getSqrtRatioAtTick(tickUpper),
        JSBI.BigInt(liquidity.toString()),
        false,
      ),
    );
  } else if (tickCurrent < tickUpper) {
    currentAmount = CurrencyAmount.fromRawAmount(
      token0,
      SqrtPriceMath.getAmount0Delta(
        JSBI.BigInt(sqrtPriceX96.toString()),
        TickMath.getSqrtRatioAtTick(tickUpper),
        JSBI.BigInt(liquidity.toString()),
        false,
      ),
    );
  } else {
    currentAmount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(0));
  }

  return ethers.utils.parseUnits(currentAmount.toExact(), token0.decimals);
}

export function getAmount1FromLPStats(
  token1: Token,
  sqrtPriceX96: ethers.BigNumber,
  tickCurrent: number,
  tickLower: number,
  tickUpper: number,
  liquidity: ethers.BigNumber,
): ethers.BigNumber {
  let currentAmount: CurrencyAmount<Token>;

  if (tickCurrent < tickLower) {
    currentAmount = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(0));
  } else if (tickCurrent < tickUpper) {
    currentAmount = CurrencyAmount.fromRawAmount(
      token1,
      SqrtPriceMath.getAmount1Delta(
        TickMath.getSqrtRatioAtTick(tickLower),
        JSBI.BigInt(sqrtPriceX96.toString()),
        JSBI.BigInt(liquidity.toString()),
        false,
      ),
    );
  } else {
    currentAmount = CurrencyAmount.fromRawAmount(
      token1,
      SqrtPriceMath.getAmount1Delta(
        TickMath.getSqrtRatioAtTick(tickLower),
        TickMath.getSqrtRatioAtTick(tickUpper),
        JSBI.BigInt(liquidity.toString()),
        false,
      ),
    );
  }

  return ethers.utils.parseUnits(currentAmount.toExact(), token1.decimals);
}

export function computeDeltasFromActivity(
  activity: ActivityByControllerQuery['activities'][0],
  controller: PaprController,
  chainId: number,
): [ethers.BigNumber, ethers.BigNumber] {
  const amount0Added = ethers.BigNumber.from(activity.totalLiquidity0!);
  const amount1Added = ethers.BigNumber.from(activity.totalLiquidity1!);

  const token0 = controller.token0IsUnderlying
    ? erc20TokenToToken(controller.underlying, chainId)
    : erc20TokenToToken(controller.paprToken, chainId);

  const token1 = controller.token0IsUnderlying
    ? erc20TokenToToken(controller.paprToken, chainId)
    : erc20TokenToToken(controller.underlying, chainId);

  const currentAmount0 = getAmount0FromLPStats(
    token0,
    ethers.BigNumber.from(activity.sqrtPricePool!),
    activity.tickCurrent!,
    activity.positionTickLower!,
    activity.positionTickUpper!,
    ethers.BigNumber.from(activity.totalLiquidityAdded!),
  );
  const currentAmount1 = getAmount1FromLPStats(
    token1,
    ethers.BigNumber.from(activity.sqrtPricePool!),
    activity.tickCurrent!,
    activity.positionTickLower!,
    activity.positionTickUpper!,
    ethers.BigNumber.from(activity.totalLiquidityAdded!),
  );

  console.log({
    currentAmount0,
    currentAmount1,
  });

  return [currentAmount0.sub(amount0Added), currentAmount1.sub(amount1Added)];
}
