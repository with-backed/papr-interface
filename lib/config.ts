import { ParsedUrlQuery } from 'querystring';

const baseConfig = {
  centerCode: 'backed-xyz',
  infuraId: '54c753f04ec64374aa679e383e7f84d5',
  nftPortApiKey: '39de5023-b9ef-42cf-a730-ce98537d2d8d',
};

export type Config = typeof paprMeme;

export type SupportedToken = keyof typeof configs;
export type SupportedNetwork = 'ethereum' | 'goerli';

// Limited Alchemy API key for use on localdev only. Prod ones can only be used from our prod site's location.
const developmentAlchemyKey = 'BtHbvji7nhBOC943JJB2XoXMSJAh64g-';

// Paid alchemy key. Safe to include in code because it is scoped to our domain.j
const prodAlchemyKey = 'aoKdUYwv3VnTO9uURR6JzpZaf-9ssuRz';

const alchemyId =
  process.env.VERCEL_ENV === 'production'
    ? prodAlchemyKey
    : developmentAlchemyKey;

const goerliJsonRpcProvider = `https://eth-goerli.alchemyapi.io/v2/${alchemyId}`;

const paprTrash: Config = {
  ...baseConfig,
  tokenName: 'paprTrash',
  centerNetwork: 'ethereum-goerli',
  chainId: 5,
  jsonRpcProvider: goerliJsonRpcProvider,
  alchemyId,
  openSeaUrl: 'https://testnets.opensea.io',
  etherscanUrl: 'https://goerli.etherscan.io',
  siteUrl: 'https://staging.withbacked.xyz',
  network: 'goerli',
  controllerAddress: '0xeef3203c99a37682b15bd782b46a1db68948b084',
  underlyingAddress: '0x3089b47853df1b82877beef6d904a0ce98a12553',
  paprTokenAddress: '0xce7676bd398032a330a5252d3ea26ee31adb69ad',
  uniswapSubgraph:
    'https://api.thegraph.com/subgraphs/name/liqwiz/uniswap-v3-goerli',
  paprMemeSubgraph:
    'https://api.goldsky.com/api/public/project_cl9fqfatx1kql0hvkak9eesug/subgraphs/papr-goerli/0.1.6/gn',
  oracleBaseUrl:
    process.env.NEXT_PUBLIC_ENV === 'local'
      ? 'http://localhost:3000'
      : 'https://v2-interface-rosy.vercel.app',
  paprUnderlyingAddress: '0x3089b47853df1b82877beef6d904a0ce98a12553',
  reservoirAPI: 'https://api-goerli.reservoir.tools',
  reservoirMarketplace: 'https://goerli-marketplace-gules.vercel.app',
  erc721Subgraph:
    'https://api.thegraph.com/subgraphs/name/adamgobes/erc721-goerli',
};

const paprHero: Config = {
  ...baseConfig,
  tokenName: 'paprHero',
  centerNetwork: 'ethereum-goerli',
  chainId: 5,
  jsonRpcProvider: goerliJsonRpcProvider,
  alchemyId,
  openSeaUrl: 'https://testnets.opensea.io',
  etherscanUrl: 'https://goerli.etherscan.io',
  siteUrl: 'https://staging.withbacked.xyz',
  network: 'goerli',
  controllerAddress: '0x3777b4b21489d2f0114e178c0cb2bb7332c8c3bd',
  underlyingAddress: '0x68b7e050e6e2c7efe11439045c9d49813c1724b8',
  paprTokenAddress: '0xe93eb054835b73abd7425e01f13b13b539b8b773',
  uniswapSubgraph:
    'https://api.thegraph.com/subgraphs/name/liqwiz/uniswap-v3-goerli',
  paprMemeSubgraph:
    'https://api.goldsky.com/api/public/project_cl9fqfatx1kql0hvkak9eesug/subgraphs/papr-goerli/0.1.6/gn',
  oracleBaseUrl:
    process.env.NEXT_PUBLIC_ENV === 'local'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_ENV === 'preview'
      ? 'https://v2-interface-rosy.vercel.app'
      : 'https://www.papr.wtf',
  paprUnderlyingAddress: '0x68b7e050e6e2c7efe11439045c9d49813c1724b8',
  reservoirAPI: 'https://api-goerli.reservoir.tools',
  reservoirMarketplace: 'https://goerli-marketplace-gules.vercel.app',
  erc721Subgraph:
    'https://api.thegraph.com/subgraphs/name/adamgobes/erc721-goerli',
};

const paprMeme = {
  ...baseConfig,
  tokenName: 'paprMeme',
  centerNetwork: 'ethereum-mainnet',
  infuraId:
    process.env.VERCEL_ENV === 'production'
      ? '54c753f04ec64374aa679e383e7f84d5'
      : developmentAlchemyKey,
  openSeaUrl: 'https://opensea.io',
  etherscanUrl: 'https://etherscan.io',
  chainId: 1,
  jsonRpcProvider: `https://eth-mainnet.alchemyapi.io/v2/${alchemyId}`,
  alchemyId,
  siteUrl: 'https://withbacked.xyz',
  network: 'ethereum',
  controllerAddress: 'TODO update this when we have a papr controller',
  underlyingAddress: '',
  paprTokenAddress: '',
  uniswapSubgraph: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  paprMemeSubgraph: 'TODO: update this when we have a prod subgraph',
  paprUnderlyingAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  oracleBaseUrl: '',
  reservoirAPI: 'https://api.reservoir.tools',
  reservoirMarketplace: '',
  erc721Subgraph: '',
};

export function getConfig(configName: string) {
  const c: { [name: string]: any } = {
    paprtrash: paprTrash,
    paprhero: paprHero,
    paprmeme: paprMeme,
  };
  return c[configName.toLowerCase()];
}

// DEPRECATE IN FAVOR OF getConfig
export const configs = {
  paprTrash,
  paprHero,
  paprMeme,
};

export const prodConfigs = [paprMeme];

export const devConfigs = [paprTrash, paprHero];

const SUPPORTED_TOKENS = new Set(Object.keys(configs));

export function isSupportedToken(token?: string): token is SupportedToken {
  return typeof token === 'string' && SUPPORTED_TOKENS.has(token);
}

export function validateToken(query: ParsedUrlQuery) {
  const token = query.token as string;

  if (!token) {
    throw new Error('No network specified in path, cannot render.');
  }

  if (!SUPPORTED_TOKENS.has(token)) {
    throw new Error(`${token} is not a supported Papr token.`);
  }

  return true;
}
