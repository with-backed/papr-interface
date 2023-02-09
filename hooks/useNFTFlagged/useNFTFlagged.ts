import { useConfig } from 'hooks/useConfig';
import { getNFTIsFlagged } from 'lib/oracle/reservoir';
import { useEffect, useState } from 'react';

export function useNFTFlagged(contractAddress: string, tokenId: string) {
  const config = useConfig();
  const [isFlagged, setIsFlagged] = useState(false);

  useEffect(() => {
    const fetchFlagged = async () => {
      const flagged = await getNFTIsFlagged(contractAddress, tokenId, config);
      setIsFlagged(flagged);
    };
    fetchFlagged();
  }, [contractAddress, tokenId]);

  return isFlagged;
}
