import { SupportedNetwork } from 'lib/config';
import { strategyPricesData, StrategyPricesData } from 'lib/strategies/charts';
import { GetServerSideProps } from 'next';
import {
  BorrowPageContent,
  BorrowPageProps,
} from 'components/Strategy/BorrowPageContent';
import {
  fetchSubgraphData,
  makeLendingStrategy,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { useConfig } from 'hooks/useConfig';
import { useSigner } from 'wagmi';
import { useEffect, useMemo, useState } from 'react';

type ServerSideProps = Omit<
  BorrowPageProps,
  'lendingStrategy' | 'pricesData'
> & {
  subgraphStrategy: SubgraphStrategy;
  subgraphPool: SubgraphPool;
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context,
) => {
  const address = (context.params?.strategy as string).toLowerCase();
  const network = context.params?.network as SupportedNetwork;

  const strategySubgraphData = await fetchSubgraphData(address);

  if (!strategySubgraphData) {
    return {
      notFound: true,
    };
  }

  const { pool, lendingStrategy } = strategySubgraphData;

  return {
    props: {
      strategyAddress: address,
      subgraphStrategy: lendingStrategy,
      subgraphPool: pool,
    },
  };
};

export default function Borrow({
  strategyAddress,
  subgraphStrategy,
  subgraphPool,
}: ServerSideProps) {
  const config = useConfig();
  const { data: signer } = useSigner();

  const lendingStrategy = useMemo(() => {
    return makeLendingStrategy(subgraphStrategy, subgraphPool, signer!, config);
  }, [config, signer, subgraphPool, subgraphStrategy]);

  const [pricesData, setPricesData] = useState<StrategyPricesData | null>(null);

  useEffect(() => {
    strategyPricesData(
      lendingStrategy,
      config.network as SupportedNetwork,
    ).then(setPricesData);
  }, [lendingStrategy, config]);

  return (
    <BorrowPageContent
      lendingStrategy={lendingStrategy}
      strategyAddress={strategyAddress}
      pricesData={pricesData}
    />
  );
}
