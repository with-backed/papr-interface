import StrategiesToBorrowFrom from 'components/StrategiesToBorrowFrom/StrategiesToBorrowFrom';
import { useConfig } from 'hooks/useConfig';
import { getAllStrategies } from 'lib/pAPRSubgraph';
import { LendingStrategy, populateLendingStrategy } from 'lib/strategies';
import { StrategyPricesData, strategyPricesData } from 'lib/strategies/charts';
import { GetServerSideProps } from 'next';
import { LendingStrategy as SubgraphLendingStrategy } from 'types/generated/graphql/inKindSubgraph';
import { useCallback, useEffect, useState } from 'react';
import strategyStyles from 'components/Strategy/Strategy.module.css';
import styles from './strategiesBorrow.module.css';
import { SupportedNetwork } from 'lib/config';

export type SelectStrategyBorrowPageProps = {
  strategyAddresses: string[];
  pricesData: { [key: string]: StrategyPricesData };
};

export const getServerSideProps: GetServerSideProps<
  SelectStrategyBorrowPageProps
> = async (context) => {
  const network = context.params?.network as SupportedNetwork;
  const strategies = await getAllStrategies();
  const pricesData: { [key: string]: StrategyPricesData } = {};
  for (let i = 0; i < strategies.length; i++) {
    pricesData[strategies[i].id] = await strategyPricesData(
      strategies[i] as SubgraphLendingStrategy,
      network as SupportedNetwork,
    );
  }

  return {
    props: {
      strategyAddresses: strategies.map((s) => s.id),
      pricesData,
    },
  };
};

export default function SelectStrategyBorrowPage({
  strategyAddresses,
  pricesData,
}: SelectStrategyBorrowPageProps) {
  const config = useConfig();
  const [lendingStrategies, setLendingStrategies] = useState<LendingStrategy[]>(
    [],
  );
  const [strategiesLoading, setStrategiesLoading] = useState<boolean>(true);

  const populate = useCallback(async () => {
    const populatedStrategies = await Promise.all(
      strategyAddresses.map((strategyAddress) =>
        populateLendingStrategy(strategyAddress, config),
      ),
    );
    setLendingStrategies(populatedStrategies);
    setStrategiesLoading(false);
  }, [config, strategyAddresses]);

  useEffect(() => {
    populate();
  }, [populate]);

  if (strategiesLoading) return <></>;

  return (
    <div className={strategyStyles.wrapper}>
      <div className={styles.selectStrategyWrapper}>
        <div className={strategyStyles.column}>
          <StrategiesToBorrowFrom
            strategies={lendingStrategies}
            pricesData={pricesData}
          />
        </div>
      </div>
    </div>
  );
}
