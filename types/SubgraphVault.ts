import { VaultByIdQuery } from './generated/graphql/inKindSubgraph';

export type SubgraphVault = Omit<
  NonNullable<VaultByIdQuery['vault']>,
  'controller'
>;
