import { TestPageContent } from 'components/Strategy/TestPageContent';
import { useConfig } from 'hooks/useConfig';
import {
  makeLendingStrategy,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { subgraphStrategyByAddress } from 'lib/pAPRSubgraph';
import { subgraphUniswapPoolById } from 'lib/uniswapSubgraph';
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
      subgraphStrategy: subgraphStrategy.lendingStrategy,
      subgraphPool: subgraphPool.pool,
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
