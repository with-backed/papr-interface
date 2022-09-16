import { getAddress } from 'ethers/lib/utils';
import { Config } from 'lib/config';
import { getNextVaultNonceForUser } from 'lib/pAPRSubgraph';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type CenterUserNFTsResponse = {
  address: string;
  smallPreviewImageUrl: string;
  tokenId: string;
};

export const useCenterNFTs = (
  address: string | undefined,
  collection: string | undefined,
  config: Config,
) => {
  const [userCollectionNFTs, setUserCollectionNFTs] = useState<
    CenterUserNFTsResponse[]
  >([]);
  const [nftsLoading, setNFTsLoading] = useState<boolean>(true);

  const getAllUserNFTs = useCallback(
    async (address: string, collection: string) => {
      try {
        const response = await fetch(
          `https://api.center.dev/v1/${
            config.centerNetwork
          }/account/${getAddress(
            address,
          )}/assets-owned?limit=100&collection=${getAddress(collection)}`,
          {
            headers: {
              'X-API-Key': process.env.NEXT_PUBLIC_CENTER_KEY!,
            },
          },
        );
        const json = await response.json();
        setUserCollectionNFTs(json.items);
        setNFTsLoading(false);
      } catch (e) {
        console.error(e);
        setNFTsLoading(false);
      }
    },
    [address, collection, config],
  );

  useEffect(() => {
    if (!address || !collection) return;
    getAllUserNFTs(address, collection);
  }, [address, collection]);

  return { userCollectionNFTs, nftsLoading };
};
