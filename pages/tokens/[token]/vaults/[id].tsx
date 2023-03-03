import { captureException } from '@sentry/nextjs';
import { VaultPageContent } from 'components/Controllers/VaultPageContent';
import { OpenGraph } from 'components/OpenGraph';
import { useConfig } from 'hooks/useConfig';
import { ControllerContextProvider } from 'hooks/useController';
import { MarketPriceProvider } from 'hooks/useLatestMarketPrice';
import { configProxy, SupportedToken } from 'lib/config';
import {
  fetchSubgraphData,
  SubgraphController,
  SubgraphPool,
} from 'lib/PaprController';
import { GetServerSideProps } from 'next';

import styles from '../controller.module.css';

type ServerSideProps = {
  vaultId: string;
  subgraphController: SubgraphController;
  subgraphPool: SubgraphPool;
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context,
) => {
  const token = context.params?.token as string;
  const id = context.params?.id as string;
  const config = configProxy[token];
  if (!config) {
    return {
      notFound: true,
    };
  }

  const controllerSubgraphData = await fetchSubgraphData(
    config.controllerAddress.toLocaleLowerCase(),
    config.uniswapSubgraph,
    config.tokenName as SupportedToken,
  );

  if (!controllerSubgraphData) {
    const e = new Error(
      `subgraph data for controller ${config.controllerAddress} not found`,
    );
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
      <OpenGraph title={`${tokenName} | Vault`} />
      <div className={styles.column}>
        <a href={`/tokens/${tokenName}`}>⬅ controller</a>
        <ControllerContextProvider value={subgraphController}>
          <MarketPriceProvider>
            <VaultPageContent vaultId={vaultId} subgraphPool={subgraphPool} />
          </MarketPriceProvider>
        </ControllerContextProvider>
      </div>
    </>
  );
}
