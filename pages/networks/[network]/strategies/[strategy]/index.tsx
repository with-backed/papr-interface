import { GetServerSideProps } from 'next';
import { strategyPricesData } from 'lib/strategies/charts';
import { configs, SupportedNetwork } from 'lib/config';
import {
  StrategyOverviewContent,
  StrategyPageProps,
} from 'components/Strategies/StrategyOverviewContent';
import { useMemo } from 'react';
import {
  fetchSubgraphData,
  makeLendingStrategy,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { useSigner } from 'wagmi';
import { useConfig } from 'hooks/useConfig';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { getOracleInfoFromAllowedCollateral } from 'lib/strategies';

type ServerSideProps = Omit<
  StrategyPageProps,
  'lendingStrategy' | 'pricesData'
> & {
  subgraphStrategy: SubgraphStrategy;
  oracleInfo: { [key: string]: ReservoirResponseData };
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

  const oracleInfo = await getOracleInfoFromAllowedCollateral(
    lendingStrategy.allowedCollateral.map((ac) => ac.contractAddress),
    network,
  );

  return {
    props: {
      address: address,
      subgraphStrategy: lendingStrategy,
      oracleInfo,
      subgraphPool: pool,
    },
  };
};

export default function StrategyPage({
  address,
  subgraphStrategy,
  oracleInfo,
  subgraphPool,
}: ServerSideProps) {
  const config = useConfig();
  const { data: signer } = useSigner();

  const lendingStrategy = useMemo(() => {
    return makeLendingStrategy(
      subgraphStrategy,
      subgraphPool,
      oracleInfo,
      signer!,
      config,
    );
  }, [config, signer, subgraphPool, oracleInfo, subgraphStrategy]);

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
    <StrategyOverviewContent
      address={address}
      lendingStrategy={lendingStrategy}
      pricesData={pricesData}
    />
  );
}
