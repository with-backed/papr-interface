import { useConfig } from 'hooks/useConfig';
import { configs, SupportedNetwork } from 'lib/config';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { getOracleInfoFromAllowedCollateral } from 'lib/strategies';
import { GetServerSideProps } from 'next';
import styles from '../strategy.module.css';
import { useLendingStrategy } from 'hooks/useLendingStrategy';
import { VaultPageContent } from 'components/Strategies/VaultPageContent';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { strategyPricesData } from 'lib/strategies/charts';

type ServerSideProps = {
  vaultId: string;
  subgraphStrategy: SubgraphStrategy;
  oracleInfo: { [key: string]: ReservoirResponseData };
  subgraphPool: SubgraphPool;
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context,
) => {
  const address = (context.params?.strategy as string).toLowerCase();
  const network = context.params?.network as SupportedNetwork;
  const id = context.params?.id as string;

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
  const oracleInfo = await getOracleInfoFromAllowedCollateral(
    lendingStrategy.allowedCollateral.map((ac) => ac.contractAddress),
    network,
  );

  return {
    props: {
      vaultId: id,
      subgraphStrategy: lendingStrategy,
      oracleInfo,
      subgraphPool: pool,
    },
  };
};

export default function VaultPage({
  vaultId,
  subgraphPool,
  oracleInfo,
  subgraphStrategy,
}: ServerSideProps) {
  const lendingStrategy = useLendingStrategy({
    subgraphStrategy,
    subgraphPool,
    oracleInfo,
  });
  const { network, uniswapSubgraph } = useConfig();

  const pricesData = useAsyncValue(
    () =>
      strategyPricesData(
        lendingStrategy,
        network as SupportedNetwork,
        uniswapSubgraph,
      ),
    [lendingStrategy, network, uniswapSubgraph],
  );

  return (
    <div className={styles.column}>
      <a href={`/networks/${network}/strategies/${lendingStrategy.id}`}>
        ⬅ strategy
      </a>
      <VaultPageContent
        lendingStrategy={lendingStrategy}
        vaultId={vaultId}
        pricesData={pricesData}
      />
    </div>
  );
}
