export enum Exchange {
  blur = 'BLUR',
  opensea = 'OPENSEA',
  looksrare = 'LOOKSRARE',
  x2y2 = 'X2Y2',
  etherscan = 'ETHERSCAN',
}

type ExchangeURLGenerator = {
  [key in Exchange]: (contractAddress: string, tokenId: string) => string;
};

export const exchangeUrlGenerators = {
  [Exchange.blur]: (contractAddress: string, tokenId: string) =>
    `https://blur.io/asset/${contractAddress}/${tokenId}`,
  [Exchange.opensea]: (contractAddress: string, tokenId: string) =>
    `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`,
  [Exchange.looksrare]: (contractAddress: string, tokenId: string) =>
    `https://looksrare.org/collections/${contractAddress}/${tokenId}`,
  [Exchange.x2y2]: (contractAddress: string, tokenId: string) =>
    `https://x2y2.io/eth/${contractAddress}/${tokenId}`,
  [Exchange.etherscan]: (contractAddress: string, _tokenId: string) =>
    `https://etherscan.io/token/${contractAddress}`,
};
