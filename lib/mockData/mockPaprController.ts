import { SubgraphPool } from 'lib/PaprController';

export const subgraphController = {
  id: '0x41739c3547992ca3f2a40d110ad33afeb582eb7c',
  createdAt: '1663869096',
  poolAddress: '0xcf93a7655d76b43313a69f15f01a39ea6ada5aea',
  underlying: {
    id: '0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e',
    name: 'test',
    symbol: 'TEST',
    decimals: 6,
  },
  token0IsUnderlying: false,
  target: '1000000000000000000',
  paprToken: {
    id: '0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e',
    name: 'test',
    symbol: 'TEST',
    decimals: 18,
  },
  maxLTV: '500000000000000000',
  fundingPeriod: '7776000',
  vaults: [],
  allowedCollateral: [
    {
      id: '0x41739c3547992ca3f2a40d110ad33afeb582eb7c-0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e',
      token: {
        id: '0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e',
        name: 'test',
        symbol: 'TEST',
      },
      allowed: true,
    },
  ],
  __typename: 'PaprController',
};

export const mockUniswapPool = {
  token0: {
    id: '0x3089b47853df1b82877beef6d904a0ce98a12553',
    decimals: '18',
    symbol: 'USDC',
    name: 'USDC',
    __typename: 'Token',
  },
  token1: {
    id: '0xb5e5f51e3e112634975fb44e6351380413f653ac',
    decimals: '18',
    symbol: 'dtAP_USDC',
    name: 'APE Loans debt token',
    __typename: 'Token',
  },
  feeTier: '0',
  liquidity: '0',
  totalValueLockedUSD: '0',
  volumeUSD: '0',
  __typename: 'Pool',
} as SubgraphPool;
