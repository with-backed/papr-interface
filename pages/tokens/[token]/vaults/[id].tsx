import { VaultPageContent } from 'components/Controllers/VaultPageContent';
import { OpenGraph } from 'components/OpenGraph';
import { PageLevelStatusFieldsets } from 'components/StatusFieldset/PageLevelStatusFieldsets';
import { useConfig } from 'hooks/useConfig';
import { ControllerContextProvider } from 'hooks/useController';
import { useSubgraphData } from 'hooks/useSubgraphData';
import { getConfig, SupportedToken } from 'lib/config';
import { GetServerSideProps } from 'next';

import styles from '../controller.module.css';

type ServerSideProps = {
  vaultId: string;
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

  return {
    props: {
      vaultId: id,
    },
  };
};

export default function VaultPage({ vaultId }: ServerSideProps) {
  const { tokenName } = useConfig();
  const subgraphData = useSubgraphData();

  if (!subgraphData.subgraphController || !subgraphData.subgraphPool) {
    return <PageLevelStatusFieldsets {...subgraphData} />;
  }
  return (
    <>
      <OpenGraph title={`${tokenName} | Vault`} />
      <div className={styles.column}>
        <a href={`/tokens/${tokenName}`}>⬅ controller</a>
        <ControllerContextProvider value={subgraphData.subgraphController}>
          <VaultPageContent
            vaultId={vaultId}
            subgraphPool={subgraphData.subgraphPool}
          />
        </ControllerContextProvider>
      </div>
    </>
  );
}
