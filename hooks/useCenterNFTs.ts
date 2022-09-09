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
          'X-API-Key': 'key-43ed0f00c03c-4cf3908a1526',
        },
      },
    );
    const json = await response.json();
    console.log({ json });
    setAllUserNFTs(json.items);
    setNFTsLoading(false);
  }, [address, config]);

  const userCollectionNFTs = useMemo(() => {
    console.log({ allUserNFTs });
    return allUserNFTs.filter((nft) => nft.address === collection);
  }, [allUserNFTs]);

  useEffect(() => {
    if (!address) return;
    getAllUserNFTs();
  }, [address]);

  return { userCollectionNFTs, nftsLoading };
};
