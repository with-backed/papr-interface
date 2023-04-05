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
  twabsApi: '',
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
    'https://api.goldsky.com/api/public/project_cl9fqfatx1kql0hvkak9eesug/subgraphs/papr/0.2.02/gn',
  reservoirAPI: 'https://api.reservoir.tools',
  erc721Subgraph:
    'https://api.thegraph.com/subgraphs/name/sunguru98/mainnet-erc721-subgraph',
  twabsApi: 'https://optimal-mole-21.hasura.app/v1/graphql',
};

export const configs = {
  paprHero,
  paprMeme,
};

const caseInsensitiveConfigs: { [key: string]: Config | undefined } = {
  paprhero: paprHero,
  paprmeme: paprMeme,
};

export const configProxy = new Proxy(caseInsensitiveConfigs, {
  get(target, prop) {
    try {
      return target[
        (prop as string).toLowerCase() as keyof typeof caseInsensitiveConfigs
      ];
    } catch (e) {
      return undefined;
    }
  },
});

export const prodConfigs = [paprMeme];

export const devConfigs = [paprHero];

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
