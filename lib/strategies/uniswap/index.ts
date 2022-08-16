import { ethers } from 'ethers';
import { Pool } from '@uniswap/v3-sdk';
import { Token as UniswapToken } from '@uniswap/sdk-core';
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { IUniswapV3Pool } from 'types/generated/abis';
import { Chain } from 'wagmi';
import { ERC20Token } from 'lib/strategies/index';

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
