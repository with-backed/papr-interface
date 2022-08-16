import { Pool } from '@uniswap/v3-sdk';
import { Config, SupportedNetwork } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import {
  ERC20,
  ERC20__factory,
  ERC721,
  ERC721__factory,
  IUniswapV3Pool,
  IUniswapV3Pool__factory,
  Strategy,
  Strategy__factory,
} from 'types/generated/abis';
import { Chain } from 'wagmi';
import { getPool } from './uniswap';

export type LendingStrategy = {
  name: string;
  symbol: string;
  contract: Strategy;
  pool: Pool;
  token0: ERC20Token;
  token1: ERC20Token;
  underlying: ERC20Token;
  collateral: ERC721Token;
  debtVault: ERC721;
};

export type ERC20Token = {
  contract: ERC20;
  decimals: number;
  name: string;
  symbol: string;
};

export type ERC721Token = {
  contract: ERC721;
  name: string;
  symbol: string;
};

export async function populateLendingStrategy(
  address: string,
  config: Config,
  chain: Chain,
): Promise<LendingStrategy> {
  const provider = makeProvider(
    config.jsonRpcProvider,
    config.network as SupportedNetwork,
  );
  const contract = Strategy__factory.connect(address, provider);
  const poolAddress = await contract.pool();
  const poolContract = IUniswapV3Pool__factory.connect(poolAddress, provider);

  const token0Address = await poolContract.token0();
  const token1Address = await poolContract.token1();
  const token0 = await buildToken(
    ERC20__factory.connect(token0Address, provider),
  );
  const token1 = await buildToken(
    ERC20__factory.connect(token1Address, provider),
  );
  const underlyingAddress = await contract.underlying();
  const underlying = underlyingAddress == token0Address ? token0 : token1;

  const pool = await getPool(poolContract, token0, token1, chain);

  const collateralAddress = await contract.collateral();
  const collateral = ERC721__factory.connect(collateralAddress, provider);

  const debtVaultAddress = await contract.debtVault();
  const debtVault = ERC721__factory.connect(debtVaultAddress, provider);

  return {
    name: await contract.name(),
    symbol: await contract.symbol(),
    contract: contract,
    pool: pool,
    token0: token0,
    token1: token1,
    collateral: {
      contract: collateral,
      name: await collateral.name(),
      symbol: await collateral.symbol(),
    },
    underlying,
    debtVault: debtVault,
  };
}

async function buildToken(token: ERC20): Promise<ERC20Token> {
  return {
    contract: token,
    decimals: await token.decimals(),
    symbol: await token.symbol(),
    name: await token.name(),
  };
}
