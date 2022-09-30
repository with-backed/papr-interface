import { TestPageContent } from 'components/Strategies/TestPageContent';
import { useConfig } from 'hooks/useConfig';
import { configs, SupportedNetwork } from 'lib/config';
import {
  fetchSubgraphData,
  makeLendingStrategy,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { GetServerSideProps } from 'next';
import { useMemo } from 'react';
import { useSigner } from 'wagmi';

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
  const config = useConfig();
  const { data: signer } = useSigner();

  const lendingStrategy = useMemo(() => {
    return makeLendingStrategy(subgraphStrategy, subgraphPool, signer!, config);
  }, [config, signer, subgraphPool, subgraphStrategy]);

  return <TestPageContent lendingStrategy={lendingStrategy} />;
}
