import { configs, SupportedNetwork } from 'lib/config';
import { strategyPricesData } from 'lib/strategies/charts';
import { GetServerSideProps } from 'next';
import {
  BorrowPageContent,
  BorrowPageProps,
} from 'components/Strategies/BorrowPageContent';
import {
  fetchSubgraphData,
  makeLendingStrategy,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { useConfig } from 'hooks/useConfig';
import { useSigner } from 'wagmi';
import { useMemo } from 'react';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { getAddress } from 'ethers/lib/utils';

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

  const collectionAddresses = lendingStrategy.allowedCollateral.map(
    (ac) => ac.contractAddress,
  );
  const oracleInfoFromAPI: ReservoirResponseData[] = await Promise.all(
    collectionAddresses.map(async (collectionAddress) => {
      const req = await fetch(
        `${configs[network].oracleBaseUrl}/api/networks/${network}/oracle/collections/${collectionAddress}`,
        {
          method: 'POST',
        },
      );
      const json = await req.json();
      return json;
    }),
  );
  const oracleInfo = collectionAddresses.reduce(
    (prev, current, i) => ({
      ...prev,
      [getAddress(current)]: oracleInfoFromAPI[i],
    }),
    {},
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
  const { data: signer } = useSigner();

  const lendingStrategy = useMemo(() => {
    return makeLendingStrategy(subgraphStrategy, subgraphPool, signer!, config);
  }, [config, signer, subgraphPool, subgraphStrategy]);

  const pricesData = useAsyncValue(
    () =>
      strategyPricesData(
        lendingStrategy,
        config.network as SupportedNetwork,
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
