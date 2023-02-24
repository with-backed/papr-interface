import { ethers } from 'ethers';

export const ONE = ethers.BigNumber.from(10).pow(18);
export const SECONDS_IN_A_DAY = 60 * 60 * 24;
export const SECONDS_IN_AN_HOUR = 60 * 60;
export const SECONDS_IN_A_YEAR = 31_536_000;
export const INTEREST_RATE_PERCENT_DECIMALS = 3;
export const MIN_RATE = 1 / 10 ** (INTEREST_RATE_PERCENT_DECIMALS - 2);

export const Q96 = ethers.BigNumber.from(2).pow(96);
export const Q192 = Q96.pow(2);

export const SCALAR = ethers.BigNumber.from(10).pow(
  INTEREST_RATE_PERCENT_DECIMALS,
);

export const oracleInfoArgEncoded =
  'tuple(tuple(bytes32 id, bytes payload, uint256 timestamp, bytes signature) message, tuple(uint8 v, bytes32 r, bytes32 s) sig) oracleInfo';

export const swapParamsArgEncoded = `tuple(uint256 amount, uint256 minOut, uint160 sqrtPriceLimitX96, address swapFeeTo, uint256 swapFeeBips, uint256 deadline) swapParams`;

export const DISCORD_URL = 'https://discord.gg/ZCxGuE6Ytk';
export const DISCORD_ERROR_CHANNEL = '#🪲bug-reports';
export const TWITTER_URL = 'https://twitter.com/backed_xyz';
export const GITHUB_URL = 'https://github.com/with-backed';
export const FAQ_URL =
  'https://with-backed.notion.site/FAQ-df65a5002100406eb6c5211fb8e105cf';
export const BUNNY_IMG_URL_MAP = {
  paprTrash: '/logos/backed-bunny.png',
  paprHero: '/logos/backed-bunny.png',
  paprMeme: '/logos/backed-bunny.png',
};

export const COMMUNITY_NFT_CONTRACT_ADDRESS =
  '0x63a9addF2327A0F4B71BcF9BFa757E333e1B7177';
export const COMMUNITY_NFT_SUBGRAPH =
  'https://api.thegraph.com/subgraphs/name/with-backed/backed-community-nft';

export const OPENGRAPH_DEFAULT_DESCRIPTION =
  'Instant loans for NFT owners, instant exposure for lenders, powered by Uniswap V3';

/// Uniswap subgraph constants
// Fri Apr 23 2021 09:42:55 GMT+0000 (beginning of Uniswap V3, can probably make this beginning of papr)
export const UNISWAP_SUBGRAPH_START = 1619170975;
export const UNISWAP_SUBGRAPH_END = Date.now() / 1000;

// Assuming 12s per block, one day ago is current block number
// minus 7200.
export const BLOCKS_IN_A_DAY = 7200;
export const BLOCKS_IN_A_HOUR = 300;
