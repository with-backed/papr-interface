import { StrategyPricesData } from 'lib/strategies/charts';
import React, { useMemo, useState } from 'react';
import strategyStyles from 'components/Strategy/Strategy.module.css';
import { AccountNFTs } from 'components/Strategy/AccountNFTs';
import { OpenVault } from 'components/Strategy/OpenVault';
import { useConfig } from 'hooks/useConfig';
import { useAccount } from 'wagmi';
import { CenterUserNFTsResponse, useCenterNFTs } from 'hooks/useCenterNFTs';
import styles from './BorrowPageContent.module.css';
import StrategiesToBorrowFrom from 'components/StrategiesToBorrowFrom/StrategiesToBorrowFrom';
import { LendingStrategy } from 'lib/LendingStrategy';
import { useAsyncValue } from 'hooks/useAsyncValue';

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

  if (!lendingStrategy || !pricesData) return <></>;

  return (
    <div className={strategyStyles.wrapper}>
      <StrategiesToBorrowFrom
        legend={`Borrow: $papr${lendingStrategy.underlying.symbol}_${lendingStrategy.symbol}${maxLTVPercent}`}
        strategies={[lendingStrategy]}
        pricesData={{ [lendingStrategy.id]: pricesData }}
        includeDetails
      />
      <AccountNFTs
        strategy={lendingStrategy}
        userCollectionNFTs={userCollectionNFTs}
        nftsSelected={nftsSelected}
        nftsLoading={nftsLoading}
        setNFTsSelected={setNFTsSelected}
      />
      <OpenVault
        strategy={lendingStrategy}
        pricesData={pricesData}
        userCollectionNFTs={userCollectionNFTs}
        nftsSelected={nftsSelected}
      />
    </div>
  );
}
