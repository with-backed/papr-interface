import { Config } from 'lib/config';
import { clientFromUrl } from 'lib/urql';
import { useEffect, useMemo, useState } from 'react';
import {
  NftsForAccountAndCollectionDocument,
  NftsForAccountAndCollectionQuery,
} from 'types/generated/graphql/erc721';

export type AccountNFTsResponse = {
  address: string;
  tokenId: string;
};

export const useAccountNFTs = (
  address: string | undefined,
  collections: string[] | undefined,
  config: Config,
) => {
  const [userCollectionNFTs, setUserCollectionNFTs] = useState<
    AccountNFTsResponse[]
  >([]);
  const [nftsLoading, setNFTsLoading] = useState<boolean>(true);

  const client = useMemo(() => {
    return clientFromUrl(config.erc721Subgraph);
  }, [config.erc721Subgraph]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await client
        .query<NftsForAccountAndCollectionQuery>(
          NftsForAccountAndCollectionDocument,
          {
            owner: address?.toLowerCase(),
            collections: collections?.map((c) => c.toLowerCase()),
          },
        )
        .toPromise();

      if (error) {
        console.error(error);
        return null;
      }

      return data?.tokens || [];
    };

    fetch().then((tokens) => {
      setUserCollectionNFTs(
        (tokens || []).map((token) => ({
          address: token.registry.id,
          tokenId: token.identifier,
        })),
      );
      setNFTsLoading(false);
    });
  }, [address, collections, client]);

  return { userCollectionNFTs, nftsLoading };
};
