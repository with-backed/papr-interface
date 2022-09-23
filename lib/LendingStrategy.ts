import { Pool } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import {
  Strategy__factory,
  Strategy,
  IUniswapV3Pool__factory,
  ERC20__factory,
  ERC20,
} from 'types/generated/abis';
import { LendingStrategyByIdQuery } from 'types/generated/graphql/inKindSubgraph';
import { PoolByIdQuery } from 'types/generated/graphql/uniswapSubgraph';
import { Config } from './config';
import { buildToken, convertONEScaledPercent, ERC20Token } from './strategies';
import { getPool } from './strategies/uniswap';

export type LendingStrategy = SubgraphStrategy & LendingStrategyInternal;
export type SubgraphStrategy = NonNullable<
  LendingStrategyByIdQuery['lendingStrategy']
>;
export type SubgraphPool = NonNullable<PoolByIdQuery['pool']>;
type SignerOrProvider = ethers.Signer | ethers.providers.Provider;

export function makeLendingStrategy(
  subgraphStrategy: SubgraphStrategy,
  subgraphPool: SubgraphPool,
  signerOrProvider: SignerOrProvider,
  config: Config,
): LendingStrategy {
  const instance = new LendingStrategyInternal(
    subgraphStrategy,
    subgraphPool,
    signerOrProvider,
    config,
  );

  Object.entries(subgraphStrategy).forEach(([k, v]) => {
    const key = k === 'underlying' ? 'underlyingAddress' : k;
    Object.defineProperty(instance, key, {
      enumerable: true,
      get() {
        return v;
      },
    });
  });

  return instance as LendingStrategy;
}

class LendingStrategyInternal {
  private _config: Config;
  private _contract: Strategy;
  private _pool?: Pool;
  private _signerOrProvider: SignerOrProvider;
  private _subgraphStrategy: SubgraphStrategy;

  // TODO: make real
  collateralAddress = process.env.NEXT_PUBLIC_MOCK_APE as string;
  collateralSymbol = 'FAPE';

  multicall: Strategy['multicall'];
  subgraphPool: SubgraphPool;
  token0: ERC20;
  token1: ERC20;

  constructor(
    subgraphStrategy: SubgraphStrategy,
    subgraphPool: SubgraphPool,
    signerOrProvider: SignerOrProvider,
    config: Config,
  ) {
    this._subgraphStrategy = subgraphStrategy;
    this.subgraphPool = subgraphPool;
    this._signerOrProvider = signerOrProvider;
    this._contract = Strategy__factory.connect(
      subgraphStrategy.id,
      signerOrProvider,
    );
    this._config = config;
    this.token0 = ERC20__factory.connect(
      subgraphPool.token0.id,
      signerOrProvider,
    );
    this.token1 = ERC20__factory.connect(
      subgraphPool.token1.id,
      signerOrProvider,
    );
    this.multicall = this._contract.multicall;
  }

  index() {
    return this._contract.index();
  }

  lastUpdated() {
    return this._contract.lastUpdated();
  }

  maxLTV() {
    return this._contract.maxLTV();
  }

  async maxLTVPercent() {
    const maxLTV = await this._contract.maxLTV();
    return convertONEScaledPercent(maxLTV, 2);
  }

  multiplier() {
    return this._contract.multiplier();
  }

  newNorm() {
    return this._contract.newNorm();
  }

  async pool() {
    if (this._pool) {
      return this._pool;
    }

    const poolContract = IUniswapV3Pool__factory.connect(
      this._subgraphStrategy.poolAddress,
      this._signerOrProvider,
    );

    const token0Address = this.subgraphPool.token0.id;
    const token1Address = this.subgraphPool.token1.id;
    const [token0, token1] = await Promise.all([
      buildToken(ERC20__factory.connect(token0Address, this._signerOrProvider)),
      buildToken(ERC20__factory.connect(token1Address, this._signerOrProvider)),
    ]);

    const pool = await getPool(
      poolContract,
      token0,
      token1,
      this._config.chainId,
    );
    this._pool = pool;
    return pool;
  }

  async reduceDebt(vaultId: ethers.BigNumberish, amount: ethers.BigNumberish) {
    return this._contract.reduceDebt(vaultId, amount);
  }

  async targetAnnualGrowthPercent() {
    const targetAnnualGrowth = await this._contract.targetAPR();
    return convertONEScaledPercent(targetAnnualGrowth, 2);
  }

  targetGrowthPerPeriod() {
    return this._contract.targetGrowthPerPeriod();
  }

  get token0IsUnderlying() {
    return this._subgraphStrategy.underlying === this.subgraphPool.token0.id;
  }

  get underlying() {
    return this._subgraphStrategy.underlying === this.subgraphPool.token0.id
      ? this.subgraphPool.token0
      : this.subgraphPool.token1;
  }
}
