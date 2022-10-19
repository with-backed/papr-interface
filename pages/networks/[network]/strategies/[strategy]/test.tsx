import { TestPageContent } from 'components/Strategies/TestPageContent';
import { configs, SupportedNetwork } from 'lib/config';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { GetServerSideProps } from 'next';
import { useLendingStrategy } from 'hooks/useLendingStrategy';

export type TestProps = {
  subgraphStrategy: SubgraphStrategy;
  subgraphPool: SubgraphPool;
};

export const getServerSideProps: GetServerSideProps<TestProps> = async (
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
      subgraphStrategy: lendingStrategy,
      subgraphPool: pool,
    },
  };
};

export default function InKindTest({
  subgraphPool,
  subgraphStrategy,
}: TestProps) {
  const lendingStrategy = useLendingStrategy({
    subgraphStrategy,
    subgraphPool,
    oracleInfo: {},
  });

  return <TestPageContent lendingStrategy={lendingStrategy} />;
}
