import { getAddress } from 'ethers/lib/utils';
import { Config } from 'lib/config';
import { useCallback, useEffect, useState } from 'react';

export type CenterUserNFTsResponse = {
  address: string;
  smallPreviewImageUrl: string;
  tokenId: string;
};

export const useCenterNFTs = (
  address: string | undefined,
  collections: string[] | undefined,
  config: Config,
) => {
  const [userCollectionNFTs, setUserCollectionNFTs] = useState<
    CenterUserNFTsResponse[]
  >([]);
  const [nftsLoading, setNFTsLoading] = useState<boolean>(true);

  const getAllUserNFTs = useCallback(
    async (address: string, collections: string[]) => {
      const allNFTsFromCollections = await Promise.all(
        collections.map(async (collection) => {
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
            return json.items as CenterUserNFTsResponse[];
          } catch (e) {
            console.error(e);
            return [];
          }
        }),
      );
      setUserCollectionNFTs(allNFTsFromCollections.flat());
      setNFTsLoading(false);
    },
    [address, collections, config],
  );

  useEffect(() => {
    console.log({ address, collections });
    if (!address || !collections) return;
    getAllUserNFTs(address, collections);
  }, [address, collections]);

  return { userCollectionNFTs, nftsLoading };
};
