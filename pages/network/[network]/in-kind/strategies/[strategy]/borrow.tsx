import AccountNFTs from 'components/Strategy/AccountNFTs/AccountNFTs';
import OpenVault from 'components/Strategy/OpenVault/OpenVault';
import { SupportedNetwork } from 'lib/config';
import { subgraphStrategyByAddress } from 'lib/pAPRSubgraph';
import { LendingStrategy, populateLendingStrategy } from 'lib/strategies';
import { strategyPricesData, StrategyPricesData } from 'lib/strategies/charts';
import strategyStyles from './strategy.module.css';
import borrowStyles from './borrow.module.css';
import { LendingStrategy as SubgraphLendingStrategy } from 'types/generated/graphql/inKindSubgraph';
import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { useConfig } from 'hooks/useConfig';
import { useAccount } from 'wagmi';
import { useCenterNFTs } from 'hooks/useCenterNFTs';

export type BorrowPageProps = {
  strategyAddress: string;
  pricesData: StrategyPricesData | null;
};

export const getServerSideProps: GetServerSideProps<BorrowPageProps> = async (
  context,
) => {
  const address = (context.params?.strategy as string).toLowerCase();
  const network = context.params?.network as SupportedNetwork;

  const subgraphStrategy = await subgraphStrategyByAddress(address);

  let pricesData: StrategyPricesData | null = null;
  if (subgraphStrategy?.lendingStrategy) {
    pricesData = await strategyPricesData(
      subgraphStrategy.lendingStrategy as SubgraphLendingStrategy,
      network,
    );
  }

  return {
    props: {
      strategyAddress: address,
      pricesData: pricesData,
    },
  };
};

export default function Borrow({
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
  }, [address, config]);

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
      <div className={borrowStyles.borrowWrapper}>
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
