import { captureException } from '@sentry/nextjs';
import { configs, SupportedNetwork, SupportedToken } from './config';

// based on output from https://api.coingecko.com/api/v3/asset_platforms
const networkMap: { [key: string]: string } = {
  optimism: 'optimistic-ethereum',
  ethereum: 'ethereum',
  goerli: 'goerli',
  polygon: 'polygon-pos',
};

// given a toCurrency, returns how much 1 ETH is worth in that currency
export async function getUnitPriceForEth(
  toCurrency: string,
  network: SupportedNetwork,
) {
  if (network == 'goerli') {
    return 1.0;
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=${toCurrency}`,
    );
    const json = await res.json();

    if (json) {
      return json.ethereum[toCurrency] as number | undefined;
    }
  } catch (e) {
    captureException(e);
  }
  return undefined;
}

// given a currency, returns how much 1 unit of that currency is worth in ETH
export async function getUnitPriceForCoinInEth(
  currency: string,
  network: SupportedNetwork,
) {
  const unitPriceForEth = await getUnitPriceForEth(currency, network);
  if (unitPriceForEth) return 1 / unitPriceForEth;
  return undefined;
}

export async function getUnitPriceForCoin(
  tokenAddress: string,
  toCurrency: string,
  token: SupportedToken,
): Promise<number | undefined> {
  const network = configs[token].network;
  // TODO: does coingecko support goerli?
  if (network === 'goerli') {
    return 1.01;
  }

  if (network && networkMap[network]) {
    const statsRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/${networkMap[network]}/contract/${tokenAddress}`,
    );

    const json = await statsRes.json();

    return json?.market_data?.current_price[toCurrency];
  }

  // unhandled network
  return undefined;
}
