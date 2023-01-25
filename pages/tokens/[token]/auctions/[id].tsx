import controllerStyles from 'components/Controllers/Controller.module.css';
import { useCallback, useMemo } from 'react';
import { AuctionPageContent } from 'components/Controllers/AuctionPageContent/AuctionPageContent';
import { ControllerContextProvider, PaprController } from 'hooks/useController';
import { GetServerSideProps } from 'next';
import { configs, getConfig, SupportedToken } from 'lib/config';
import { fetchSubgraphData } from 'lib/PaprController';
import { captureException } from '@sentry/nextjs';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import {
  AuctionDocument,
  AuctionQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { PoolByIdQuery } from 'types/generated/graphql/uniswapSubgraph';
import { Activity } from 'components/Controllers/Activity';
import { generateVaultId } from 'lib/controllers/vaults';
import { useQuery } from 'urql';
import { Custom404 } from 'components/Custom404';

type AuctionProps = {
  subgraphController: PaprController;
  subgraphPool: NonNullable<PoolByIdQuery['pool']>;
  auctionId: string;
};

export const getServerSideProps: GetServerSideProps<AuctionProps> = async (
  context,
) => {
  const token = context.params?.token as SupportedToken;
  const address: string | undefined =
    getConfig(token)?.controllerAddress?.toLocaleLowerCase();
  if (!address) {
    return {
      notFound: true,
    };
  }

  const controllerSubgraphData = await fetchSubgraphData(
    address,
    configs[token].uniswapSubgraph,
    token,
  );

  if (!controllerSubgraphData) {
    const e = new Error(`subgraph data for controller ${address} not found`);
    captureException(e);
    throw e;
  }

  const { paprController, pool } = controllerSubgraphData;

  return {
    props: {
      subgraphController: paprController,
      subgraphPool: pool,
      auctionId: context.params?.id as string,
    },
  };
};

export default function Auction({
  subgraphController,
  subgraphPool,
  auctionId,
}: AuctionProps) {
  const collections = useMemo(
    () => subgraphController.allowedCollateral.map((c) => c.token.id),
    [subgraphController.allowedCollateral],
  );

  const [{ data: auctionQueryResult, fetching }, reexecuteQuery] =
    useQuery<AuctionQuery>({
      query: AuctionDocument,
      variables: { id: auctionId },
    });

  const auction = useMemo(() => {
    return auctionQueryResult?.auction;
  }, [auctionQueryResult]);

  const auctionVaultId = useMemo(() => {
    if (!auction) return '';
    return generateVaultId(
      subgraphController.id,
      auction.vault.account,
      auction.auctionAssetContract.id,
    );
  }, [subgraphController.id, auction]);

  const refresh = useCallback(() => {
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, [reexecuteQuery]);

  if (!fetching && !auction) {
    return <Custom404 />;
  }

  if (!auction) {
    return <></>;
  }

  return (
    <OracleInfoProvider collections={collections}>
      <ControllerContextProvider value={subgraphController}>
        <div className={controllerStyles.wrapper}>
          <AuctionPageContent auction={auction} refresh={refresh} />
          <Activity
            subgraphPool={subgraphPool}
            vault={auctionVaultId}
            showSwaps={false}
          />
        </div>
      </ControllerContextProvider>
    </OracleInfoProvider>
  );
}
