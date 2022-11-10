import { GetServerSideProps } from 'next';
import { strategyPricesData } from 'lib/strategies/charts';
import { configs, SupportedToken } from 'lib/config';
import {
  StrategyOverviewContent,
  StrategyPageProps,
} from 'components/Strategies/StrategyOverviewContent';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { useConfig } from 'hooks/useConfig';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { getOracleInfoFromAllowedCollateral } from 'lib/strategies';
import { useLendingStrategy } from 'hooks/useLendingStrategy';

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
  const token = context.params?.token as SupportedToken;

  const strategySubgraphData = await fetchSubgraphData(
    address,
    configs[token].uniswapSubgraph,
  );

  if (!strategySubgraphData) {
    return {
      notFound: true,
    };
  }

  const { pool, lendingStrategy } = strategySubgraphData;

  const oracleInfo = await getOracleInfoFromAllowedCollateral(
    lendingStrategy.allowedCollateral.map((ac) => ac.contractAddress),
    token,
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
  const lendingStrategy = useLendingStrategy({
    subgraphStrategy,
    subgraphPool,
    oracleInfo,
  });

  const pricesData = useAsyncValue(
    () =>
      strategyPricesData(
        lendingStrategy,
        config.tokenName as SupportedToken,
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
