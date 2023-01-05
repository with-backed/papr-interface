import { ParsedUrlQuery } from 'querystring';

const baseConfig = {
  centerCode: 'backed-xyz',
  infuraId: '54c753f04ec64374aa679e383e7f84d5',
  nftPortApiKey: '39de5023-b9ef-42cf-a730-ce98537d2d8d',
};

export type Config = typeof paprMeme;

export type SupportedToken = keyof typeof configs;
export type SupportedNetwork = 'ethereum' | 'goerli';

const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_KEY as string;

const goerliJsonRpcProvider = `https://eth-goerli.alchemyapi.io/v2/${alchemyId}`;
const goerliSubgraph =
  'https://api.goldsky.com/api/public/project_cl9fqfatx1kql0hvkak9eesug/subgraphs/papr-goerli/0.1.8/gn';

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
  controllerAddress: '0x6df74b0653ba2b622d911ef5680d1776d850ace9',
  underlyingAddress: '0xf5f4619764b3bcba95aba3b25212365fc6166862',
  paprTokenAddress: '0x103da64f4366dc82ed0393716376a89dfee4b536',
  uniswapSubgraph:
    'https://api.thegraph.com/subgraphs/name/liqwiz/uniswap-v3-goerli',
  paprMemeSubgraph: goerliSubgraph,
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
  controllerAddress: '0x9b74e0be4220317dc2f796d3ed865ccb72698020',
  underlyingAddress: '0x68b7e050e6e2c7efe11439045c9d49813c1724b8',
  paprTokenAddress: '0x1c15aee63c64d4e8fa5e62b45f21106f51916105',
  uniswapSubgraph:
    'https://api.thegraph.com/subgraphs/name/liqwiz/uniswap-v3-goerli',
  paprMemeSubgraph: goerliSubgraph,
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
