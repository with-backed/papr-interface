import { GetServerSideProps } from 'next';
import { configs, SupportedNetwork } from 'lib/config';
import {
  OldStrategyOverviewContent,
  OldStrategyPageProps,
} from 'components/Strategies/OldStrategyOverviewContent';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { useConfig } from 'hooks/useConfig';
import { strategyPricesData } from 'lib/strategies/charts';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useLendingStrategy } from 'hooks/useLendingStrategy';

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

  const strategySubgraphData = await fetchSubgraphData(
    address,
    configs[network].uniswapSubgraph,
  );

  if (!strategySubgraphData) {
    return {
      notFound: true,
    };
  }

  const { pool, lendingStrategy } = strategySubgraphData;

  return {
    props: {
      address: address,
      subgraphStrategy: lendingStrategy,
      subgraphPool: pool,
    },
  };
};

export default function OldStrategyPage({
  address,
  subgraphStrategy,
  subgraphPool,
}: ServerSideProps) {
  const config = useConfig();

  const lendingStrategy = useLendingStrategy({
    subgraphStrategy,
    subgraphPool,
    oracleInfo: {},
  });

  const pricesData = useAsyncValue(
    () =>
      strategyPricesData(
        lendingStrategy,
        config.network as SupportedNetwork,
        config.uniswapSubgraph,
      ),
    [config, lendingStrategy],
  );

  return (
    <OldStrategyOverviewContent
      address={address}
      lendingStrategy={lendingStrategy}
      pricesData={pricesData}
    />
  );
}
