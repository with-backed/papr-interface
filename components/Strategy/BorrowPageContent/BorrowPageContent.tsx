import { StrategyPricesData } from 'lib/strategies/charts';
import React, { useCallback, useEffect, useState } from 'react';
import strategyStyles from 'components/Strategy/Strategy.module.css';
import { AccountNFTs } from 'components/Strategy/AccountNFTs';
import { OpenVault } from 'components/Strategy/OpenVault';
import { useConfig } from 'hooks/useConfig';
import { useAccount } from 'wagmi';
import { LendingStrategy, populateLendingStrategy } from 'lib/strategies';
import { useCenterNFTs } from 'hooks/useCenterNFTs';
import styles from './BorrowPageContent.module.css';

export type BorrowPageProps = {
  strategyAddress: string;
  pricesData: StrategyPricesData | null;
};

export function BorrowPageContent({
  strategyAddress,
  pricesData,
}: BorrowPageProps) {
  const config = useConfig();
  const { address } = useAccount();
  const [lendingStrategy, setLendingStrategy] =
    useState<LendingStrategy | null>(null);

  const populate = useCallback(async () => {
    const s = await populateLendingStrategy(strategyAddress, config);
    setLendingStrategy(s);
  }, [config, strategyAddress]);

  useEffect(() => {
    populate();
  }, [populate]);

  const { userCollectionNFTs, nftsLoading } = useCenterNFTs(
    address,
    lendingStrategy?.collateral.contract.address,
    config,
  );
  const [nftsSelected, setNFTsSelected] = useState<string[]>([]);

  if (!lendingStrategy || !pricesData) return <></>;

  return (
    <div className={strategyStyles.wrapper}>
      <div className={styles.borrowWrapper}>
        <div className={strategyStyles.column}>
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
            nftsSelected={nftsSelected}
          />
        </div>
      </div>
    </div>
  );
}
