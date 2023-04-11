import { getAddress } from 'ethers/lib/utils.js';
import { AccountNFTsResponse } from 'hooks/useAccountNFTs';
import { useMemo } from 'react';
import {
  AuctionsByNftOwnerAndCollectionDocument,
  AuctionsByNftOwnerAndCollectionQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { SubgraphVault } from 'types/SubgraphVault';
import { useQuery } from 'urql';
import { useAccount } from 'wagmi';

// returns all the NFTs we would want to display on the vault debt picker
// this includes all the all the NFTs in the user's wallet, all the NFTs in the vault, and all the NFTs that are in auction/been auctioned
export function useVaultComponentNFTs(
  collateralContractAddress: string,
  userNFTsForVault: AccountNFTsResponse[],
  vault: SubgraphVault | undefined,
) {
  const { address } = useAccount();
  const [{ data: auctionsByNftOwnerAndCollection }] =
    useQuery<AuctionsByNftOwnerAndCollectionQuery>({
      query: AuctionsByNftOwnerAndCollectionDocument,
      variables: {
        nftOwner: address!,
        collection: collateralContractAddress.toLowerCase(),
      },
    });

  const userAndVaultNFTs = useMemo(() => {
    return (vault?.collateral || [])
      .map((c) => ({
        address: vault?.token.id,
        tokenId: c.tokenId,
        inVault: true,
        isLiquidating: false,
        isLiquidated: false,
      }))
      .concat(
        (auctionsByNftOwnerAndCollection?.auctions || []).map((a) => ({
          address: a.auctionAssetContract.id,
          tokenId: a.auctionAssetID,
          inVault: false,
          isLiquidating: !a.endPrice,
          isLiquidated: !!a.endPrice,
        })),
      )
      .concat(
        userNFTsForVault
          .filter(
            // filter out nfts that are already in the vault, major assumption here is goldsky is faster than thegraph
            (nft) =>
              vault?.collateral.find(
                (c) =>
                  getAddress(vault.token.id) === getAddress(nft.address) &&
                  c.tokenId === nft.tokenId,
              ) === undefined,
          )
          .map((nft) => ({
            address: nft.address,
            tokenId: nft.tokenId,
            inVault: false,
            isLiquidating: false,
            isLiquidated: false,
          })),
      );
  }, [userNFTsForVault, vault, auctionsByNftOwnerAndCollection?.auctions]);

  return userAndVaultNFTs;
}
