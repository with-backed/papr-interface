type Exchange = 'blur' | 'opensea' | 'looksrare' | 'x2y2' | 'etherscan';

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
