import { useConfig } from 'hooks/useConfig';
import { configs, SupportedToken } from 'lib/config';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphController,
} from 'lib/PaprController';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { getOracleInfoFromAllowedCollateral } from 'lib/controllers';
import { GetServerSideProps } from 'next';
import styles from '../controller.module.css';
import { usePaprController } from 'hooks/usePaprController';
import { VaultPageContent } from 'components/Controllers/VaultPageContent';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { controllerPricesData } from 'lib/controllers/charts';

type ServerSideProps = {
  vaultId: string;
  subgraphController: SubgraphController;
  oracleInfo: { [key: string]: ReservoirResponseData };
  subgraphPool: SubgraphPool;
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context,
) => {
  const address = (context.params?.controller as string).toLowerCase();
  const token = context.params?.token as SupportedToken;
  const id = context.params?.id as string;

  const controllerSubgraphData = await fetchSubgraphData(
    address,
    configs[token].uniswapSubgraph,
  );

  if (!controllerSubgraphData) {
    return {
      notFound: true,
    };
  }

  const { pool, paprController } = controllerSubgraphData;
  const oracleInfo = await getOracleInfoFromAllowedCollateral(
    paprController.allowedCollateral.map((ac) => ac.contractAddress),
    token,
  );

  return {
    props: {
      vaultId: id,
      subgraphController: paprController,
      oracleInfo,
      subgraphPool: pool,
    },
  };
};

export default function VaultPage({
  vaultId,
  subgraphPool,
  oracleInfo,
  subgraphController,
}: ServerSideProps) {
  const paprController = usePaprController({
    subgraphController,
    subgraphPool,
    oracleInfo,
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
    <div className={styles.column}>
      <a href={`/tokens/${tokenName}/controllers/${paprController.id}`}>
        ⬅ controller
      </a>
      <VaultPageContent
        paprController={paprController}
        vaultId={vaultId}
        pricesData={pricesData}
      />
    </div>
  );
}
