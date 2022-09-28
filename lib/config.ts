import { ParsedUrlQuery } from 'querystring';

const baseConfig = {
  centerCode: 'backed-xyz',
  infuraId: '54c753f04ec64374aa679e383e7f84d5',
  nftPortApiKey: '39de5023-b9ef-42cf-a730-ce98537d2d8d',
};

export type Config = {
  // things that aren't guaranteed to exist in all configs should be declared here
} & Omit<typeof ethereum, 'nftSalesSubgraph'>;

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
};

const optimism: Config = {
  ...baseConfig,
  centerNetwork: '',
  infuraId: '54c753f04ec64374aa679e383e7f84d5',
  openSeaUrl: 'https://quixotic.io',
  etherscanUrl: 'https://optimistic.etherscan.io',
  chainId: 10,
  jsonRpcProvider:
    'https://opt-mainnet.g.alchemy.com/v2/_K-HnfZvE5ChalM8ys4TQEkmsWn8CPTU',
  alchemyId:
    process.env.VERCEL_ENV === 'production'
      ? '_K-HnfZvE5ChalM8ys4TQEkmsWn8CPTU'
      : developmentAlchemyKey,
  siteUrl: 'https://withbacked.xyz',
  network: 'optimism',
  emailSubjectPrefix: '[Optimism]:',
  facilitatorStartBlock: 6679943,
};

const polygon: Config = {
  ...baseConfig,
  centerNetwork: '',
  infuraId: '54c753f04ec64374aa679e383e7f84d5',
  openSeaUrl: 'https://opensea.io',
  etherscanUrl: 'https://polygonscan.com',
  chainId: 137,
  jsonRpcProvider:
    'https://polygon-mainnet.g.alchemy.com/v2/sRuR0U0CxGifKBURcsLPibuCjYj8nmZJ',
  alchemyId:
    process.env.VERCEL_ENV === 'production'
      ? 'sRuR0U0CxGifKBURcsLPibuCjYj8nmZJ'
      : developmentAlchemyKey,
  siteUrl: 'https://withbacked.xyz',
  network: 'polygon',
  emailSubjectPrefix: '[Polygon]:',
  facilitatorStartBlock: 28234089,
};

export const configs = {
  ethereum,
  goerli,
  optimism,
  polygon,
};

export const prodConfigs = [ethereum, optimism, polygon];

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
