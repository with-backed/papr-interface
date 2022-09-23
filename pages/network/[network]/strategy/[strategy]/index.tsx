import { GetServerSideProps } from 'next';
import { subgraphStrategyByAddress } from 'lib/pAPRSubgraph';
import { strategyPricesData, StrategyPricesData } from 'lib/strategies/charts';
import { SupportedNetwork } from 'lib/config';
import {
  StrategyOverviewContent,
  StrategyPageProps,
} from 'components/Strategy/StrategyOverviewContent';
import { useEffect, useMemo, useState } from 'react';
import {
  makeLendingStrategy,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { useSigner } from 'wagmi';
import { useConfig } from 'hooks/useConfig';
import { subgraphUniswapPoolById } from 'lib/uniswapSubgraph';

type ServerSideProps = Omit<
  StrategyPageProps,
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

  const subgraphStrategy = await subgraphStrategyByAddress(address);

  if (!subgraphStrategy?.lendingStrategy) {
    return {
      notFound: true,
    };
  }

  const subgraphPool = await subgraphUniswapPoolById(
    subgraphStrategy.lendingStrategy.poolAddress,
  );

  if (!subgraphPool?.pool) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      address: address,
      subgraphStrategy: subgraphStrategy.lendingStrategy,
      subgraphPool: subgraphPool.pool,
    },
  };
};

export default function StrategyPage({
  address,
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
    <StrategyOverviewContent
      address={address}
      lendingStrategy={lendingStrategy}
      pricesData={pricesData}
    />
  );
}
