import { LendingStrategyByIdQuery } from 'types/generated/graphql/inKindSubgraph';

export type LendingStrategy = SubgraphStrategy & LendingStrategyInternal;
export type SubgraphStrategy = NonNullable<
  LendingStrategyByIdQuery['lendingStrategy']
>;

export function makeLendingStrategy(
  subgraphStrategy: SubgraphStrategy,
): LendingStrategy {
  const instance = new LendingStrategyInternal(subgraphStrategy);

  Object.entries(subgraphStrategy).forEach(([k, v]) => {
    Object.defineProperty(instance, k, {
      enumerable: true,
      get() {
        return v;
      },
    });
  });

  return instance as LendingStrategy;
}

class LendingStrategyInternal {
  private subgraphStrategy: SubgraphStrategy;

  constructor(subgraphStrategy: SubgraphStrategy) {
    this.subgraphStrategy = subgraphStrategy;
  }
}
