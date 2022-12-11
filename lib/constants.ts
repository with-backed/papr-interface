export const ONE = BigNumber.from(10).pow(18);
export const SECONDS_IN_A_DAY = 60 * 60 * 24;
export const SECONDS_IN_AN_HOUR = 60 * 60;
export const SECONDS_IN_A_YEAR = 31_536_000;
export const INTEREST_RATE_PERCENT_DECIMALS = 3;
export const MIN_RATE = 1 / 10 ** (INTEREST_RATE_PERCENT_DECIMALS - 2);

export const Q96 = BigNumber.from(2).pow(96);
export const Q192 = Q96.pow(2);

export const SCALAR = BigNumber.from(10).pow(INTEREST_RATE_PERCENT_DECIMALS);

export const oracleInfoArgEncoded =
  'tuple(tuple(bytes32 id, bytes payload, uint256 timestamp, bytes signature) message, tuple(uint8 v, bytes32 r, bytes32 s) sig) oracleInfo';

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
  'Welcome to Backed protocol - NFT Lending. View existing loans, lend against NFTs, or propose loan terms on your own NFTs.';
