import blur from 'public/blur.svg';
import blurGray from 'public/blur-gray.svg';
import etherscan from 'public/etherscan.svg';
import etherscanGray from 'public/etherscan-gray.svg';
import looksrare from 'public/looksrare.svg';
import looksrareGray from 'public/looksrare-gray.svg';
import opensea from 'public/opensea.svg';
import openseaGray from 'public/opensea-gray.svg';
import x2y2 from 'public/x2y2.svg';
import x2y2Gray from 'public/x2y2-Gray.svg';

export const allExchanges = [
  'blur',
  'opensea',
  'looksrare',
  'x2y2',
  'etherscan',
] as const;

export type Exchange = typeof allExchanges[number];

type ExchangeURLGenerator = {
  [key in Exchange]: (contractAddress: string, tokenId: string) => string;
};

export const exchangeUrlGenerators: ExchangeURLGenerator = {
  blur: (contractAddress: string, tokenId: string) =>
    `https://blur.io/asset/${contractAddress}/${tokenId}`,
  opensea: (contractAddress: string, tokenId: string) =>
    `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`,
  looksrare: (contractAddress: string, tokenId: string) =>
    `https://looksrare.org/collections/${contractAddress}/${tokenId}`,
  x2y2: (contractAddress: string, tokenId: string) =>
    `https://x2y2.io/eth/${contractAddress}/${tokenId}`,
  etherscan: (contractAddress: string, _tokenId: string) =>
    `https://etherscan.io/token/${contractAddress}`,
};

export const exchangeImages = {
  blur: {
    gray: blurGray,
    color: blur,
  },
  opensea: {
    gray: openseaGray,
    color: opensea,
  },
  looksrare: {
    gray: looksrareGray,
    color: looksrare,
  },
  x2y2: {
    gray: x2y2Gray,
    color: x2y2,
  },
  etherscan: {
    gray: etherscanGray,
    color: etherscan,
  },
};
