import { ParsedUrlQuery } from 'querystring';

const baseConfig = {
  infuraId: '54c753f04ec64374aa679e383e7f84d5',
  siteUrl: 'https://www.papr.wtf',
};

export type Config = typeof paprMeme;

export type SupportedToken = keyof typeof configs;
export type SupportedNetwork = 'ethereum' | 'goerli';

const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_KEY as string;

const goerliJsonRpcProvider = `https://eth-goerli.alchemyapi.io/v2/${alchemyId}`;
const goerliSubgraph =
  'https://api.goldsky.com/api/public/project_cl9fqfatx1kql0hvkak9eesug/subgraphs/papr-goerli/0.1.95/gn';

const paprTrash: Config = {
  ...baseConfig,
  tokenName: 'paprTrash',
  centerNetwork: 'ethereum-goerli',
  chainId: 5,
  jsonRpcProvider: goerliJsonRpcProvider,
  alchemyId,
  etherscanUrl: 'https://goerli.etherscan.io',
  network: 'goerli',
  controllerAddress: '0x9de959beb8c84710e929b2182c97007f3c372d73',
  underlyingAddress: '0xf5f4619764b3bcba95aba3b25212365fc6166862',
  paprTokenAddress: '0x1f1552f82ff0331d223bf9a9c9ae68c5cc8a2026',
  uniswapSubgraph:
    'https://api.thegraph.com/subgraphs/name/liqwiz/uniswap-v3-goerli',
  paprSubgraph: goerliSubgraph,
  reservoirAPI: 'https://api-goerli.reservoir.tools',
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
  etherscanUrl: 'https://goerli.etherscan.io',
  network: 'goerli',
  controllerAddress: '0x092018ff54df5bfa53e1c6e75ad0e2d8991a8b1e',
  underlyingAddress: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
  paprTokenAddress: '0x6f32f58cd64d0ba76a16f5e8ff11498d965a82dc',
  uniswapSubgraph:
    'https://api.thegraph.com/subgraphs/name/liqwiz/uniswap-v3-goerli',
  paprSubgraph: goerliSubgraph,
  reservoirAPI: 'https://api-goerli.reservoir.tools',
  erc721Subgraph:
    'https://api.thegraph.com/subgraphs/name/adamgobes/erc721-goerli',
};

const paprMeme = {
  ...baseConfig,
  tokenName: 'paprMeme',
  centerNetwork: 'ethereum-mainnet',
  etherscanUrl: 'https://etherscan.io',
  chainId: 1,
  jsonRpcProvider: `https://eth-mainnet.alchemyapi.io/v2/${alchemyId}`,
  alchemyId,
  network: 'ethereum',
  controllerAddress: '0x3b29c19ff2fcea0ff98d0ef5b184354d74ea74b0',
  underlyingAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  paprTokenAddress: '0x320aaab3038bc08317f5a4be19ea1d9608551d79',
  uniswapSubgraph: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  paprSubgraph:
    'https://api.goldsky.com/api/public/project_cl9fqfatx1kql0hvkak9eesug/subgraphs/papr/0.1.95/gn',
  reservoirAPI: 'https://api.reservoir.tools',
  erc721Subgraph:
    'https://api.thegraph.com/subgraphs/name/sunguru98/mainnet-erc721-subgraph',
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
