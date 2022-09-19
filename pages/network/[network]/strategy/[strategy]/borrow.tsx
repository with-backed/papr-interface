import { SupportedNetwork } from 'lib/config';
import { subgraphStrategyByAddress } from 'lib/pAPRSubgraph';
import { strategyPricesData, StrategyPricesData } from 'lib/strategies/charts';
import { LendingStrategy as SubgraphLendingStrategy } from 'types/generated/graphql/inKindSubgraph';
import { GetServerSideProps } from 'next';
import {
  BorrowPageContent,
  BorrowPageProps,
} from 'components/Strategy/BorrowPageContent';

export const getServerSideProps: GetServerSideProps<BorrowPageProps> = async (
  context,
) => {
  const address = (context.params?.strategy as string).toLowerCase();
  const network = context.params?.network as SupportedNetwork;

  const subgraphStrategy = await subgraphStrategyByAddress(address);

  let pricesData: StrategyPricesData | null = null;
  if (subgraphStrategy?.lendingStrategy) {
    pricesData = await strategyPricesData(
      subgraphStrategy.lendingStrategy as SubgraphLendingStrategy,
      network,
    );
  }

  return {
    props: {
      strategyAddress: address,
      pricesData: pricesData,
    },
  };
};

export default function Borrow({
  strategyAddress,
  pricesData,
}: BorrowPageProps) {
  return (
    <BorrowPageContent
      strategyAddress={strategyAddress}
      pricesData={pricesData}
    />
  );
}
