import {
  PaprControllersDocument,
  PaprControllersQuery,
  PaprControllerByIdDocument,
  PaprControllerByIdQuery,
  VaultsByOwnerForControllerDocument,
  VaultsByOwnerForControllerQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { PaprController, SubgraphController } from './PaprController';
import { clientFromUrl } from './urql';

export async function subgraphControllerByAddress(id: string) {
  // TODO: dynamic client address
  const client = clientFromUrl(
    'https://api.goldsky.com/api/public/project_cl9fqfatx1kql0hvkak9eesug/subgraphs/papr-goerl/0.1.0/gn',
  );
  const { data, error } = await client
    .query<PaprControllerByIdQuery>(PaprControllerByIdDocument, { id })
    .toPromise();

  if (error) {
    console.error(error);
    return null;
  }

  return data || null;
}

export async function getAllPaprControllers(): Promise<SubgraphController[]> {
  const client = clientFromUrl(
    'https://api.goldsky.com/api/public/project_cl9fqfatx1kql0hvkak9eesug/subgraphs/papr-goerl/0.1.0/gn',
  );
  const { data, error } = await client
    .query<PaprControllersQuery>(PaprControllersDocument, {})
    .toPromise();

  if (error) {
    console.error(error);
    return [];
  }

  return data?.paprControllers || [];
}
