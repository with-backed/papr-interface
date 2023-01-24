import { Pool } from '@uniswap/v3-sdk';
import { ethers, Overrides, providers } from 'ethers';
import {
  PaprController__factory,
  PaprController as GenPaprController,
  IUniswapV3Pool__factory,
  ERC20__factory,
  ERC20,
  ERC721,
  ERC721__factory,
} from 'types/generated/abis';
import {
  INFTEDA,
  ReservoirOracleUnderwriter,
} from 'types/generated/abis/PaprController';
import { PaprControllerByIdQuery } from 'types/generated/graphql/inKindSubgraph';
import { PoolByIdQuery } from 'types/generated/graphql/uniswapSubgraph';
import { Config, SupportedToken } from './config';
import { ReservoirResponseData } from './oracle/reservoir';
import { subgraphControllerByAddress } from './pAPRSubgraph';
import { buildToken, convertOneScaledValue } from './controllers';
import { getPool } from './controllers/uniswap';
import { subgraphUniswapPoolById } from './uniswapSubgraph';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { getAddress } from 'ethers/lib/utils';

export type PaprController_deprecated = SubgraphController &
  PaprControllerInternal;
export type SubgraphController = NonNullable<
  PaprControllerByIdQuery['paprController']
>;
export type SubgraphPool = NonNullable<PoolByIdQuery['pool']>;
type SignerOrProvider = ethers.Signer | ethers.providers.Provider;

/**
 * PaprController factory function, merges the class definition with
 * properties from subgraph. This is more convenient than adding these
 * properties to the class statically (auto-updates when subgraph query
 * changes), and allows us to assert a type that includes those dynamic
 * properties.
 *
 * @param subgraphController the controller info from our subgraph
 * @param subgraphPool the associated pool info from Uniswap subgraph
 * @param signerOrProvider should be signer for contract ops, but provider is ok for logged-out
 * @param config network-specific config
 * @returns PaprController
 */
export function makePaprController(
  subgraphController: SubgraphController,
  subgraphPool: SubgraphPool,
  signerOrProvider: SignerOrProvider,
  config: Config,
): PaprController_deprecated {
  const instance = new PaprControllerInternal(
    subgraphController,
    subgraphPool,
    signerOrProvider
      ? signerOrProvider
      : new providers.AlchemyProvider(config.network, config.alchemyId),
    config,
  );

  Object.entries(subgraphController).forEach(([k, v]) => {
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

  return instance as PaprController_deprecated;
}

/**
 * Mega-object to orchestrate all parts of lending controller, including Uniswap
 * pool info and method calls. Should not be exported, use the factory function.
 *
 * Instead of exposing contract we write wrapper methods for the contract
 * functions we want to use. Strictly speaking this conforms to the Law of Demeter
 * but if it gets too tedious we can come up with another way.
 */
class PaprControllerInternal {
  private _config: Config;
  private _contract: GenPaprController;
  private _pool?: Pool;
  private _signerOrProvider: SignerOrProvider;
  private _subgraphController: SubgraphController;

  multicall: GenPaprController['multicall'];
  subgraphPool: SubgraphPool;
  token0: ERC20;
  token1: ERC20;
  collateralContracts: ERC721[];
  maxLTVBigNum: ethers.BigNumber;
  maxLTVPercent: number;
  _cachedNewTarget: ethers.BigNumber | null;
  _targetLastFetched: number;

  constructor(
    subgraphController: SubgraphController,
    subgraphPool: SubgraphPool,
    signerOrProvider: SignerOrProvider,
    config: Config,
  ) {
    this._subgraphController = subgraphController;
    this.subgraphPool = subgraphPool;
    this._signerOrProvider = signerOrProvider;
    this._contract = PaprController__factory.connect(
      subgraphController.id,
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
    this.collateralContracts = this._subgraphController.allowedCollateral.map(
      (c) => {
        return ERC721__factory.connect(c.token.id, signerOrProvider);
      },
    );
    this.maxLTVBigNum = ethers.BigNumber.from(this._subgraphController.maxLTV);
    this.maxLTVPercent = convertOneScaledValue(
      ethers.BigNumber.from(this._subgraphController.maxLTV),
      2,
    );
    this._cachedNewTarget = null;
    this._targetLastFetched = Date.now() / 1000;
  }

  index() {
    return 1;
  }

  lastUpdated() {
    return this._contract.lastUpdated();
  }

  async newTarget() {
    const now = Date.now() / 1000;
    if (now - this._targetLastFetched > 10 || !this._cachedNewTarget) {
      const newTarget = await this._contract.newTarget();
      this._cachedNewTarget = newTarget;
      this._targetLastFetched = now;
      return newTarget;
    }
    return this._cachedNewTarget;
  }

  target() {
    return this._contract.target();
  }

  async pool() {
    if (this._pool) {
      return this._pool;
    }

    const poolContract = IUniswapV3Pool__factory.connect(
      this._subgraphController.poolAddress,
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

  async reduceDebt(
    account: string,
    collateralAsset: string,
    amount: ethers.BigNumberish,
  ) {
    return this._contract.reduceDebt(account, collateralAsset, amount);
  }

  get token0IsUnderlying() {
    return this._subgraphController.token0IsUnderlying;
  }

  get underlying() {
    return this._subgraphController.token0IsUnderlying
      ? this.subgraphPool.token0
      : this.subgraphPool.token1;
  }

  get debtToken() {
    return this._subgraphController.token0IsUnderlying
      ? this.subgraphPool.token1
      : this.subgraphPool.token0;
  }

  async _maxDebt_deprecated(totalCollateraValue: ethers.BigNumber) {
    const maxLoanUnderlying = totalCollateraValue.mul(
      ethers.BigNumber.from(this._subgraphController.maxLTV),
    );
    return maxLoanUnderlying.div(await this.newTarget());
  }

  async maxDebt_deprecated(
    collateralAssets: string[],
    oracleInfo: OracleInfo,
  ): Promise<ethers.BigNumber> {
    const totalDebtPerCollateral = await Promise.all(
      collateralAssets.map(async (asset) =>
        this._maxDebt_deprecated(
          ethers.utils.parseUnits(
            oracleInfo[getAddress(asset)].price.toString(),
            this.underlying.decimals,
          ),
        ),
      ),
    );

    return totalDebtPerCollateral.reduce(
      (a, b) => a.add(b),
      ethers.BigNumber.from(0),
    );
  }

  async purchaseLiquidationAuctionNFT(
    auction: INFTEDA.AuctionStruct,
    maxPrice: ethers.BigNumberish,
    sendTo: string,
    oracleInfo: ReservoirOracleUnderwriter.OracleInfoStruct,
  ) {
    return this._contract.purchaseLiquidationAuctionNFT(
      auction,
      maxPrice,
      sendTo,
      oracleInfo,
      { gasLimit: ethers.BigNumber.from(ethers.utils.hexValue(3000000)) },
    );
  }
}

/**
 * Returns an object containing the subgraph data required to instantiate
 * PaprController, or returns null if any subgraph data is not found.
 *
 * TODO: fallback to node?
 */
export async function fetchSubgraphData(
  controllerAddress: string,
  uniswapSubgraphUrl: string,
  token: SupportedToken,
) {
  const subgraphController = await subgraphControllerByAddress(
    controllerAddress,
    token,
  );

  if (!subgraphController?.paprController) {
    return null;
  }

  const subgraphPool = await subgraphUniswapPoolById(
    subgraphController.paprController.poolAddress,
    uniswapSubgraphUrl,
  );

  if (!subgraphPool?.pool) {
    return null;
  }

  return {
    paprController: subgraphController.paprController,
    pool: subgraphPool.pool,
  };
}
