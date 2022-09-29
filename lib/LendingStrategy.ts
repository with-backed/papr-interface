import { Pool } from '@uniswap/v3-sdk';
import { ethers, Overrides, providers } from 'ethers';
import {
  Strategy__factory,
  Strategy,
  IUniswapV3Pool__factory,
  ERC20__factory,
  ERC20,
  ERC721,
  ERC721__factory,
} from 'types/generated/abis';
import { LendingStrategyByIdQuery } from 'types/generated/graphql/inKindSubgraph';
import { PoolByIdQuery } from 'types/generated/graphql/uniswapSubgraph';
import { Config } from './config';
import { subgraphStrategyByAddress } from './pAPRSubgraph';
import { buildToken, convertONEScaledPercent, ERC20Token } from './strategies';
import { getPool } from './strategies/uniswap';
import { subgraphUniswapPoolById } from './uniswapSubgraph';

export type LendingStrategy = SubgraphStrategy & LendingStrategyInternal;
export type SubgraphStrategy = NonNullable<
  LendingStrategyByIdQuery['lendingStrategy']
>;
export type SubgraphPool = NonNullable<PoolByIdQuery['pool']>;
type SignerOrProvider = ethers.Signer | ethers.providers.Provider;

/**
 * LendingStrategy factory function, merges the class definition with
 * properties from subgraph. This is more convenient than adding these
 * properties to the class statically (auto-updates when subgraph query
 * changes), and allows us to assert a type that includes those dynamic
 * properties.
 *
 * @param subgraphStrategy the strategy info from our subgraph
 * @param subgraphPool the associated pool info from Uniswap subgraph
 * @param signerOrProvider should be signer for contract ops, but provider is ok for logged-out
 * @param config network-specific config
 * @returns LendingStrategy
 */
export function makeLendingStrategy(
  subgraphStrategy: SubgraphStrategy,
  subgraphPool: SubgraphPool,
  signerOrProvider: SignerOrProvider,
  config: Config,
): LendingStrategy {
  const instance = new LendingStrategyInternal(
    subgraphStrategy,
    subgraphPool,
    !!signerOrProvider
      ? signerOrProvider
      : new providers.AlchemyProvider(config.network, config.alchemyId),
    config,
  );

  Object.entries(subgraphStrategy).forEach(([k, v]) => {
    const key = k === 'underlying' ? 'underlyingAddress' : k;
    // TypeScript doesn't automatically pick up additions through `defineProperty`
    // which is why we cast the return at then end.
    Object.defineProperty(instance, key, {
      enumerable: true,
      get() {
        return v;
      },
    });
  });

  return instance as LendingStrategy;
}

/**
 * Mega-object to orchestrate all parts of lending strategy, including Uniswap
 * pool info and method calls. Should not be exported, use the factory function.
 *
 * Instead of exposing contract we write wrapper methods for the contract
 * functions we want to use. Strictly speaking this conforms to the Law of Demeter
 * but if it gets too tedious we can come up with another way.
 */
class LendingStrategyInternal {
  private _config: Config;
  private _contract: Strategy;
  private _pool?: Pool;
  private _signerOrProvider: SignerOrProvider;
  private _subgraphStrategy: SubgraphStrategy;

  multicall: Strategy['multicall'];
  subgraphPool: SubgraphPool;
  token0: ERC20;
  token1: ERC20;
  collateralContracts: ERC721[];

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
    this.collateralContracts = this._subgraphStrategy.allowedCollateral.map(
      (c) => {
        return ERC721__factory.connect(c.contractAddress, signerOrProvider);
      },
    );
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

  async mintAndSellDebt(
    vaultNonce: ethers.BigNumberish,
    debt: ethers.BigNumberish,
    minOut: ethers.BigNumberish,
    sqrtPriceLimitX96: ethers.BigNumberish,
    proceedsTo: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ) {
    return this._contract.mintAndSellDebt(
      vaultNonce,
      debt,
      minOut,
      sqrtPriceLimitX96,
      proceedsTo,
      overrides,
    );
  }

  async buyAndReduceDebt(
    vaultId: ethers.BigNumberish,
    underlyingAmount: ethers.BigNumberish,
    minOut: ethers.BigNumberish,
    sqrtPriceLimitX96: ethers.BigNumberish,
    proceedsTo: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ) {
    return this._contract.buyAndReduceDebt(
      vaultId,
      underlyingAmount,
      minOut,
      sqrtPriceLimitX96,
      proceedsTo,
      overrides,
    );
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

  get debtToken() {
    return this._subgraphStrategy.underlying === this.subgraphPool.token0.id
      ? this.subgraphPool.token1
      : this.subgraphPool.token0;
  }
}

/**
 * Returns an object containing the subgraph data required to instantiate
 * LendingStrategy, or returns null if any subgraph data is not found.
 *
 * TODO: fallback to node?
 */
export async function fetchSubgraphData(strategyAddress: string) {
  const subgraphStrategy = await subgraphStrategyByAddress(strategyAddress);

  if (!subgraphStrategy?.lendingStrategy) {
    return null;
  }

  const subgraphPool = await subgraphUniswapPoolById(
    subgraphStrategy.lendingStrategy.poolAddress,
  );

  if (!subgraphPool?.pool) {
    return null;
  }

  return {
    lendingStrategy: subgraphStrategy.lendingStrategy,
    pool: subgraphPool.pool,
  };
}
