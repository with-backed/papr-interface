import { TestPageContent } from 'components/Controllers/TestPageContent';
import { configs, SupportedToken } from 'lib/config';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphController,
} from 'lib/PaprController';
import { GetServerSideProps } from 'next';
import { usePaprController } from 'hooks/usePaprController';

export type TestProps = {
  subgraphController: SubgraphController;
  subgraphPool: SubgraphPool;
};

export const getServerSideProps: GetServerSideProps<TestProps> = async (
  context,
) => {
  const token = context.params?.token as SupportedToken;

  const controllerSubgraphData = await fetchSubgraphData(
    configs[token].controllerAddress,
    configs[token].uniswapSubgraph,
    token,
  );

  if (!controllerSubgraphData) {
    return {
      notFound: true,
    };
  }

  const { pool, paprController } = controllerSubgraphData;

  return {
    props: {
      subgraphController: paprController,
      subgraphPool: pool,
    },
  };
};

export default function InKindTest({
  subgraphPool,
  subgraphController,
}: TestProps) {
  const paprController = usePaprController({
    subgraphController,
    subgraphPool,
  });

  return <TestPageContent paprController={paprController} />;
}
