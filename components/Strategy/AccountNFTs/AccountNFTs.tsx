import { useRenderNFTs } from 'hooks/useCenterNFTs';
import { useConfig } from 'hooks/useConfig';
import { LendingStrategy } from 'lib/strategies';
import { useAccount } from 'wagmi';

export type AccountNFTsProps = {
  strategy: LendingStrategy;
};

export default function AccountNFTs({ strategy }: AccountNFTsProps) {
  const { address } = useAccount();
  const config = useConfig();
  const { userCollectionNFTs, nftsLoading } = useRenderNFTs(
    address,
    strategy.collateral.contract.address,
    config,
  );

  if (nftsLoading) return <></>;

  return (
    <div>
      {userCollectionNFTs.map((nft) => (
        <div key={`${nft.address}-${nft.tokenId}`}>{nft.address}</div>
      ))}
    </div>
  );
}
