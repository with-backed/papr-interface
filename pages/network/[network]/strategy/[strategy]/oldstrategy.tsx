import { GetServerSideProps } from 'next';
import { LendingStrategy as SubgraphLendingStrategy } from 'types/generated/graphql/inKindSubgraph';
import { subgraphStrategyByAddress } from 'lib/pAPRSubgraph';
import { StrategyPricesData, strategyPricesData } from 'lib/strategies/charts';
import { SupportedNetwork } from 'lib/config';
import {
  StrategyOverviewContent,
  StrategyPageProps,
} from 'components/Strategy/StrategyOverviewContent';

export const getServerSideProps: GetServerSideProps<StrategyPageProps> = async (
  context,
) => {
  const address = (context.params?.strategy as string).toLowerCase();
  const network = context.params?.network as SupportedNetwork;

  const subgraphStrategy = await subgraphStrategyByAddress(address);

  var pricesData: StrategyPricesData | null = null;
  if (subgraphStrategy?.lendingStrategy) {
    pricesData = await strategyPricesData(
      subgraphStrategy.lendingStrategy as SubgraphLendingStrategy,
      network,
    );
  }

  return {
    props: {
      address: address,
      subgraphLendingStrategy: subgraphStrategy?.lendingStrategy || null,
      pricesData: pricesData,
    },
  };
};

export default function OldStrategyPage({
  address,
  subgraphLendingStrategy,
  pricesData,
}: StrategyPageProps) {
  return (
    <StrategyOverviewContent
      address={address}
      subgraphLendingStrategy={subgraphLendingStrategy}
      pricesData={pricesData}
    />
  );
}
