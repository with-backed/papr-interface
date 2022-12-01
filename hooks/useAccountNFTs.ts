import { Config } from 'lib/config';
import { useEffect, useMemo, useState } from 'react';
import {
  NftsForAccountAndCollectionDocument,
  NftsForAccountAndCollectionQuery,
} from 'types/generated/graphql/erc721';
import { useQuery } from 'urql';

export type AccountNFTsResponse = {
  address: string;
  tokenId: string;
};

export const useAccountNFTs = (
  address: string | undefined,
  collections: string[] | undefined,
  config: Config,
) => {
  // Cache last result, so that when refreshing we don't have a flash of
  // blank page while new results are fetching
  const [prevData, setPrevData] = useState<
    NftsForAccountAndCollectionQuery | undefined
  >(undefined);
  const [{ data, fetching: nftsLoading }, reexecuteQuery] =
    useQuery<NftsForAccountAndCollectionQuery>({
      query: NftsForAccountAndCollectionDocument,
      variables: {
        owner: address?.toLowerCase(),
        collections: collections?.map((c) => c.toLowerCase()),
      },
      context: useMemo(
        () => ({
          url: config.erc721Subgraph,
        }),
        [config],
      ),
    });

  useEffect(() => {
    if (data) {
      setPrevData(data);
    }
  }, [data]);

  const dataToUse = data ?? prevData;

  const userCollectionNFTs = useMemo(() => {
    if (!dataToUse?.tokens) return [];
    return dataToUse?.tokens.map((token) => ({
      address: token.registry.id,
      tokenId: token.identifier,
    }));
  }, [dataToUse]);

  return {
    userCollectionNFTs,
    nftsLoading,
    reexecuteQuery,
  };
};
