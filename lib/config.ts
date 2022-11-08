import { ParsedUrlQuery } from 'querystring';

const baseConfig = {
  centerCode: 'backed-xyz',
  infuraId: '54c753f04ec64374aa679e383e7f84d5',
  nftPortApiKey: '39de5023-b9ef-42cf-a730-ce98537d2d8d',
};

export type Config = {
  // things that aren't guaranteed to exist in all configs should be declared here
  // TODO: when we move to prod, these should be in each config and not optional
  strategyAddress?: string;
} & Omit<typeof ethereum, 'strategyAddress'>;

export type SupportedNetwork = keyof typeof configs;

// Limited Alchemy API key for use on localdev only. Prod ones can only be used from our prod site's location.
const developmentAlchemyKey = 'BtHbvji7nhBOC943JJB2XoXMSJAh64g-';

const goerli: Config = {
  ...baseConfig,
  centerNetwork: 'ethereum-goerli',
  chainId: 5,
  jsonRpcProvider:
    'https://eth-goerli.alchemyapi.io/v2/BtHbvji7nhBOC943JJB2XoXMSJAh64g-',
  alchemyId: developmentAlchemyKey,
  openSeaUrl: 'https://testnets.opensea.io',
  etherscanUrl: 'https://goerli.etherscan.io',
  siteUrl: 'https://staging.withbacked.xyz',
  network: 'goerli',
  emailSubjectPrefix: '[Testnet]:',
  facilitatorStartBlock: 10550059,
  strategyAddress: '0xF478340769a200f20fEa385dEEA6D42550DD8986',
  uniswapSubgraph:
    'https://api.thegraph.com/subgraphs/name/liqwiz/uniswap-v3-goerli',
  paprMemeSubgraph: 'https://api.thegraph.com/subgraphs/name/adamgobes/sly-fox',
  oracleBaseUrl: 'http://localhost:3000',
  paprUnderlyingAddress: '0x3089b47853df1b82877beef6d904a0ce98a12553',
  reservoirAPI: 'https://api-goerli.reservoir.tools',
  paprHeroesUSDC: '0x68b7e050e6e2c7efe11439045c9d49813c1724b8',
  paprHeroesCollateral: [
    '0x0593cd2238d1b143bd1c67cd7fa98eee32a260ea',
    '0xd4e652bbfcf616c966e1b1e8ed37599d81f11889',
    '0x4770646fe8635fa9ed3cb72ed4b7ef6386a06827',
    '0xabe17952e7fe468711826c26b04b047c0da53b86',
  ],
  reservoirMarketplace: 'https://goerli-marketplace-gules.vercel.app',
};

const ethereum = {
  ...baseConfig,
  centerNetwork: 'ethereum-mainnet',
  infuraId:
    process.env.VERCEL_ENV === 'production'
      ? '54c753f04ec64374aa679e383e7f84d5'
      : developmentAlchemyKey,
  openSeaUrl: 'https://opensea.io',
  etherscanUrl: 'https://etherscan.io',
  chainId: 1,
  jsonRpcProvider:
    'https://eth-mainnet.alchemyapi.io/v2/De3LMv_8CYuN9WzVEgoOI5w7ltnGIhnH',
  alchemyId: 'De3LMv_8CYuN9WzVEgoOI5w7ltnGIhnH',
  siteUrl: 'https://withbacked.xyz',
  network: 'ethereum',
  emailSubjectPrefix: '[Ethereum]:',
  facilitatorStartBlock: 14636317,
  uniswapSubgraph: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  paprMemeSubgraph: 'TODO: update this when we have a prod subgraph',
  paprUnderlyingAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  oracleBaseUrl: '',
  reservoirAPI: 'https://api.reservoir.tools',
  paprHeroesUSDC: '',
  paprHeroesCollateral: [''],
  reservoirMarketplace: '',
};

export const configs = {
  ethereum,
  goerli,
};

export const prodConfigs = [];

export const devConfigs = [goerli];

const SUPPORTED_NETWORKS = new Set(Object.keys(configs));

export function isSupportedNetwork(
  network?: string,
): network is SupportedNetwork {
  return typeof network === 'string' && SUPPORTED_NETWORKS.has(network);
}

export function validateNetwork(query: ParsedUrlQuery) {
  const network = query.network as string;

  if (!network) {
    throw new Error('No network specified in path, cannot render.');
  }

  if (!SUPPORTED_NETWORKS.has(network)) {
    throw new Error(`${network} is not a supported network.`);
  }

  return true;
}
