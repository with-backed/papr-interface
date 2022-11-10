import { configs, SupportedToken } from 'lib/config';
import { strategyPricesData } from 'lib/strategies/charts';
import { GetServerSideProps } from 'next';
import {
  BorrowPageContent,
  BorrowPageProps,
} from 'components/Strategies/BorrowPageContent';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { useConfig } from 'hooks/useConfig';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { getOracleInfoFromAllowedCollateral } from 'lib/strategies';
import { useLendingStrategy } from 'hooks/useLendingStrategy';

type ServerSideProps = Omit<
  BorrowPageProps,
  'lendingStrategy' | 'pricesData'
> & {
  subgraphStrategy: SubgraphStrategy;
  subgraphPool: SubgraphPool;
  oracleInfo: { [key: string]: ReservoirResponseData };
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context,
) => {
  const address = (context.params?.strategy as string).toLowerCase();
  const token = context.params?.token as SupportedToken;

  const strategySubgraphData = await fetchSubgraphData(
    address,
    configs[token].uniswapSubgraph,
  );

  if (!strategySubgraphData) {
    return {
      notFound: true,
    };
  }

  const { pool, lendingStrategy } = strategySubgraphData;

  const oracleInfo = await getOracleInfoFromAllowedCollateral(
    lendingStrategy.allowedCollateral.map((ac) => ac.contractAddress),
    token,
  );

  return {
    props: {
      strategyAddress: address,
      subgraphStrategy: lendingStrategy,
      subgraphPool: pool,
      oracleInfo: oracleInfo,
    },
  };
};

export default function Borrow({
  strategyAddress,
  subgraphStrategy,
  subgraphPool,
  oracleInfo,
}: ServerSideProps) {
  const config = useConfig();

  const lendingStrategy = useLendingStrategy({
    subgraphStrategy,
    subgraphPool,
    oracleInfo,
  });

  const pricesData = useAsyncValue(
    () =>
      strategyPricesData(
        lendingStrategy,
        config.tokenName as SupportedToken,
        config.uniswapSubgraph,
      ),
    [config, lendingStrategy],
  );

  return (
    <BorrowPageContent
      lendingStrategy={lendingStrategy}
      strategyAddress={strategyAddress}
      pricesData={pricesData}
      oracleInfo={oracleInfo}
    />
  );
}
