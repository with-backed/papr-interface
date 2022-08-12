import { Config, SupportedNetwork } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import { strategy } from 'sharp';
import {
  ERC20,
  ERC20__factory,
  IUniswapV3Pool,
  IUniswapV3Pool__factory,
  Strategy,
  Strategy__factory,
} from 'types/generated/abis';

export type LendingStrategy = {
  contract: Strategy;
  pool: IUniswapV3Pool;
  token0: Token;
  token1: Token;
  underlying: Token;
};

export type Token = {
  contract: ERC20;
  decimals: number;
  name: string;
  symbol: string;
};

export async function populateLendingStrategy(
  address: string,
  config: Config,
): Promise<LendingStrategy> {
  const provider = makeProvider(
    config.jsonRpcProvider,
    config.network as SupportedNetwork,
  );
  const contract = Strategy__factory.connect(address, provider);
  const poolAddress = await contract.pool();
  const pool = IUniswapV3Pool__factory.connect(poolAddress, provider);
  const token0Address = await pool.token0();
  const token1Address = await pool.token1();
  const token0 = await buildToken(
    ERC20__factory.connect(token0Address, provider),
  );
  const token1 = await buildToken(
    ERC20__factory.connect(token1Address, provider),
  );
  const underlyingAddress = await contract.underlying();
  const underlying = underlyingAddress == token0Address ? token0 : token1;

  return {
    contract: contract,
    pool: pool,
    token0: token0,
    token1: token1,
    underlying,
  };
}

async function buildToken(token: ERC20): Promise<Token> {
  return {
    contract: token,
    decimals: await token.decimals(),
    symbol: await token.symbol(),
    name: await token.name(),
  };
}
