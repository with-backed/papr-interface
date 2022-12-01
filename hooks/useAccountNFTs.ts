import { Config } from 'lib/config';
import { useMemo } from 'react';
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

  const userCollectionNFTs = useMemo(() => {
    if (!data?.tokens) return [];
    return data?.tokens.map((token) => ({
      address: token.registry.id,
      tokenId: token.identifier,
    }));
  }, [data]);

  return {
    userCollectionNFTs,
    nftsLoading,
    reexecuteQuery,
  };
};
