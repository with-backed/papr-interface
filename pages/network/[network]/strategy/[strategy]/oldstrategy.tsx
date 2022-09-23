import { GetServerSideProps } from 'next';
import { subgraphStrategyByAddress } from 'lib/pAPRSubgraph';
import { SupportedNetwork } from 'lib/config';
import {
  OldStrategyOverviewContent,
  OldStrategyPageProps,
} from 'components/Strategy/OldStrategyOverviewContent';
import {
  makeLendingStrategy,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { subgraphUniswapPoolById } from 'lib/uniswapSubgraph';
import { useConfig } from 'hooks/useConfig';
import { useSigner } from 'wagmi';
import { useEffect, useMemo, useState } from 'react';
import { strategyPricesData, StrategyPricesData } from 'lib/strategies/charts';

type ServerSideProps = Omit<
  OldStrategyPageProps,
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

export default function OldStrategyPage({
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
    <OldStrategyOverviewContent
      address={address}
      lendingStrategy={lendingStrategy}
      pricesData={pricesData}
    />
  );
}
