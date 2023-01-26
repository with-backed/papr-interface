import { useConfig } from 'hooks/useConfig';
import { configs, getConfig, SupportedToken } from 'lib/config';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphController,
} from 'lib/PaprController';
import { GetServerSideProps } from 'next';
import styles from '../controller.module.css';
import { VaultPageContent } from 'components/Controllers/VaultPageContent';
import { OpenGraph } from 'components/OpenGraph';
import { captureException } from '@sentry/nextjs';
import { ControllerContextProvider } from 'hooks/useController';

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
  const address: string | undefined =
    getConfig(token)?.controllerAddress?.toLocaleLowerCase();
  if (!address) {
    return {
      notFound: true,
    };
  }

  const controllerSubgraphData = await fetchSubgraphData(
    address,
    configs[token].uniswapSubgraph,
    token,
  );

  if (!controllerSubgraphData) {
    const e = new Error(`subgraph data for controller ${address} not found`);
    captureException(e);
    throw e;
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
  const { tokenName } = useConfig();

  return (
    <>
      <OpenGraph
        title={`${tokenName} | Vault`}
        description={`Vault ${vaultId}`}
      />
      <div className={styles.column}>
        <a href={`/tokens/${tokenName}`}>⬅ controller</a>
        <ControllerContextProvider value={subgraphController}>
          <VaultPageContent vaultId={vaultId} subgraphPool={subgraphPool} />
        </ControllerContextProvider>
      </div>
    </>
  );
}
