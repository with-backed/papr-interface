import { StrategyPricesData } from 'lib/strategies/charts';
import React, { useMemo, useState } from 'react';
import strategyStyles from 'components/Strategies/Strategy.module.css';
import { AccountNFTs } from 'components/Strategies/AccountNFTs';
import { OpenVault } from 'components/Strategies/OpenVault';
import { useConfig } from 'hooks/useConfig';
import { useAccount } from 'wagmi';
import { useCenterNFTs } from 'hooks/useCenterNFTs';
import styles from './BorrowPageContent.module.css';
import StrategiesToBorrowFrom from 'components/StrategiesToBorrowFrom/StrategiesToBorrowFrom';
import { LendingStrategy } from 'lib/LendingStrategy';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { getUniqueNFTId } from 'lib/strategies';
import { useCurrentVault } from 'hooks/useCurrentVault/useCurrentVault';

export type BorrowPageProps = {
  strategyAddress: string;
  pricesData: StrategyPricesData | null;
  lendingStrategy: LendingStrategy;
};

export function BorrowPageContent({
  strategyAddress,
  lendingStrategy,
  pricesData,
}: BorrowPageProps) {
  const config = useConfig();
  const { address } = useAccount();

  const collateralContractAddresses = useMemo(() => {
    return lendingStrategy.allowedCollateral.map((ac) => ac.contractAddress);
  }, [lendingStrategy.allowedCollateral]);

  const { userCollectionNFTs, nftsLoading } = useCenterNFTs(
    address,
    collateralContractAddresses,
    config,
  );
  const [nftsSelected, setNFTsSelected] = useState<string[]>([]);

  const maxLTVPercent = useAsyncValue(
    () => lendingStrategy.maxLTVPercent(),
    [lendingStrategy],
  );

  const { currentVault, vaultFetching } = useCurrentVault(
    lendingStrategy,
    address,
  );

  if (!lendingStrategy || !pricesData || vaultFetching) return <></>;

  return (
    <div className={strategyStyles.wrapper}>
      <StrategiesToBorrowFrom
        legend={`Borrow: $papr${lendingStrategy.underlying.symbol}_${lendingStrategy.symbol}${maxLTVPercent}`}
        strategies={[lendingStrategy]}
        pricesData={{ [lendingStrategy.id]: pricesData }}
        includeDetails
      />
      <AccountNFTs
        strategyAddress={lendingStrategy.id}
        userCollectionNFTs={userCollectionNFTs.map((nft) =>
          getUniqueNFTId(nft.address, nft.tokenId),
        )}
        nftsSelected={nftsSelected}
        nftsLoading={nftsLoading}
        setNFTsSelected={setNFTsSelected}
      />
      <OpenVault
        strategy={lendingStrategy}
        pricesData={pricesData}
        userCollectionNFTs={userCollectionNFTs}
        currentVault={currentVault}
        nftsSelected={nftsSelected}
      />
    </div>
  );
}
