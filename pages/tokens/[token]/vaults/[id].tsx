import { useConfig } from 'hooks/useConfig';
import { configs, getConfig, SupportedToken } from 'lib/config';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphController,
} from 'lib/PaprController';
import { GetServerSideProps } from 'next';
import styles from '../controller.module.css';
import { usePaprController } from 'hooks/usePaprController';
import { VaultPageContent } from 'components/Controllers/VaultPageContent';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { controllerPricesData } from 'lib/controllers/charts';
import { OpenGraph } from 'components/OpenGraph';

type ServerSideProps = {
  vaultId: string;
  subgraphController: SubgraphController;
  subgraphPool: SubgraphPool;
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context,
) => {
  const token = context.params?.token as SupportedToken;
  const id = context.params?.id as string;
  const address = getConfig(token).controllerAddress.toLocaleLowerCase();

  const controllerSubgraphData = await fetchSubgraphData(
    address,
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
      vaultId: id,
      subgraphController: paprController,
      subgraphPool: pool,
    },
  };
};

export default function VaultPage({
  vaultId,
  subgraphPool,
  subgraphController,
}: ServerSideProps) {
  const paprController = usePaprController({
    subgraphController,
    subgraphPool,
  });
  const { tokenName, uniswapSubgraph } = useConfig();

  const pricesData = useAsyncValue(
    () =>
      controllerPricesData(
        paprController,
        tokenName as SupportedToken,
        uniswapSubgraph,
      ),
    [paprController, tokenName, uniswapSubgraph],
  );

  return (
    <>
      <OpenGraph
        title={`${tokenName} | Vault`}
        description={`Vault ${vaultId}`}
      />
      <div className={styles.column}>
        <a href={`/tokens/${tokenName}`}>⬅ controller</a>
        <VaultPageContent
          paprController={paprController}
          vaultId={vaultId}
          pricesData={pricesData}
        />
      </div>
    </>
  );
}