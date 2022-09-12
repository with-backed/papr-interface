import { getAddress } from 'ethers/lib/utils';
import { Config } from 'lib/config';
import { useCallback, useEffect, useMemo, useState } from 'react';

type RenderUserNFTsResponse = {
  address: string;
  smallPreviewImageUrl: string;
  tokenId: string;
};

export const useRenderNFTs = (
  address: string | undefined,
  collection: string,
  config: Config,
) => {
  const [allUserNFTs, setAllUserNFTs] = useState<RenderUserNFTsResponse[]>([]);
  const [nftsLoading, setNFTsLoading] = useState<boolean>(true);

  const getAllUserNFTs = useCallback(async () => {
    const response = await fetch(
      `https://api.center.dev/v1/${config.centerNetwork}/account/${address}/assets-owned`,
      {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_CENTER_KEY!,
        },
      },
    );
    const json = await response.json();
    setAllUserNFTs(json.items);
    setNFTsLoading(false);
  }, [address, config]);

  const userCollectionNFTs = useMemo(() => {
    return allUserNFTs.filter(
      (nft) => getAddress(nft.address) === getAddress(collection),
    );
  }, [allUserNFTs]);

  useEffect(() => {
    if (!address) return;
    getAllUserNFTs();
  }, [address]);

  return { userCollectionNFTs, nftsLoading };
};
