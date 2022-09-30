import StrategiesToBorrowFrom from 'components/StrategiesToBorrowFrom/StrategiesToBorrowFrom';
import { getAllStrategies } from 'lib/pAPRSubgraph';
import { StrategyPricesData, strategyPricesData } from 'lib/strategies/charts';
import { GetServerSideProps } from 'next';
import strategyStyles from 'components/Strategies/Strategy.module.css';
import styles from './strategiesBorrow.module.css';
import { configs, SupportedNetwork } from 'lib/config';
import {
  makeLendingStrategy,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { subgraphUniswapPoolById } from 'lib/uniswapSubgraph';
import { useConfig } from 'hooks/useConfig';
import { useSigner } from 'wagmi';
import { useMemo } from 'react';

export type SelectStrategyBorrowPageProps = {
  subgraphStrategies: SubgraphStrategy[];
  pricesData: { [key: string]: StrategyPricesData };
  pools: (SubgraphPool | null)[];
};

export const getServerSideProps: GetServerSideProps<
  SelectStrategyBorrowPageProps
> = async (context) => {
  const network = context.params?.network as SupportedNetwork;
  const config = configs[network];
  const subgraphStrategies = await getAllStrategies();
  const pools = await (
    await Promise.all(
      subgraphStrategies.map((s) =>
        subgraphUniswapPoolById(s.poolAddress, config.uniswapSubgraph!),
      ),
    )
  ).map((value) => value?.pool || null);
  const pricesData: { [key: string]: StrategyPricesData } = {};
  const prices = await Promise.all(
    subgraphStrategies.map((strategy) =>
      strategyPricesData(strategy, network, config.uniswapSubgraph!),
    ),
  );
  subgraphStrategies.forEach((s, i) => (pricesData[s.id] = prices[i]));

  return {
    props: {
      subgraphStrategies,
      pricesData,
      pools,
    },
  };
};

export default function SelectStrategyBorrowPage({
  subgraphStrategies,
  pricesData,
  pools,
}: SelectStrategyBorrowPageProps) {
  const config = useConfig();
  const { data: signer } = useSigner();

  const lendingStrategies = useMemo(
    () =>
      subgraphStrategies.map((s, i) =>
        makeLendingStrategy(s, pools[i]!, signer!, config),
      ),

    [config, pools, signer, subgraphStrategies],
  );

  return (
    <div className={strategyStyles.wrapper}>
      <div className={styles.selectStrategyWrapper}>
        <div className={strategyStyles.column}>
          <StrategiesToBorrowFrom
            legend="🎮 strategies"
            strategies={lendingStrategies}
            pricesData={pricesData}
            includeDetails={false}
          />
        </div>
      </div>
    </div>
  );
}
