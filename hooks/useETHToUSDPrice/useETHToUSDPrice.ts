import { useConfig } from 'hooks/useConfig';
import { getUnitPriceForEth } from 'lib/coingecko';
import { SupportedNetwork } from 'lib/config';
import { useEffect, useState } from 'react';

export function useETHToUSDPrice() {
  const { network } = useConfig();
  const [price, setPrice] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchPrice = async () => {
      return getUnitPriceForEth('usd', network as SupportedNetwork);
    };
    fetchPrice().then(setPrice);
  }, [network]);

  return price;
}
