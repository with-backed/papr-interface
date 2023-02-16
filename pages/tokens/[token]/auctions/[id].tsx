import { Activity } from 'components/Controllers/Activity';
import { AuctionPageContent } from 'components/Controllers/AuctionPageContent/AuctionPageContent';
import controllerStyles from 'components/Controllers/Controller.module.css';
import { Custom404 } from 'components/Custom404';
import { PageLevelStatusFieldsets } from 'components/StatusFieldset/PageLevelStatusFieldsets';
import { ControllerContextProvider } from 'hooks/useController';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { useSubgraphData } from 'hooks/useSubgraphData';
import { getConfig, SupportedToken } from 'lib/config';
import { generateVaultId } from 'lib/controllers/vaults';
import { GetServerSideProps } from 'next';
import { useCallback, useMemo } from 'react';
import {
  AuctionDocument,
  AuctionQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

type AuctionProps = {
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

  return {
    props: {
      auctionId: context.params?.id as string,
    },
  };
};

export default function Auction({ auctionId }: AuctionProps) {
  const subgraphData = useSubgraphData();

  const collections = useMemo(
    () =>
      subgraphData.subgraphController
        ? subgraphData.subgraphController.allowedCollateral.map(
            (c) => c.token.id,
          )
        : [],
    [subgraphData.subgraphController],
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
    if (!auction || !subgraphData.subgraphController) return '';
    return generateVaultId(
      subgraphData.subgraphController.id,
      auction.vault.account,
      auction.auctionAssetContract.id,
    );
  }, [subgraphData.subgraphController, auction]);

  const refresh = useCallback(() => {
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, [reexecuteQuery]);

  if (!subgraphData.subgraphController || !subgraphData.subgraphPool) {
    return <PageLevelStatusFieldsets {...subgraphData} />;
  }

  if (!fetching && !auction) {
    return <Custom404 />;
  }

  if (!auction) {
    return <></>;
  }

  return (
    <OracleInfoProvider collections={collections}>
      <ControllerContextProvider value={subgraphData.subgraphController}>
        <div className={controllerStyles.wrapper}>
          <AuctionPageContent auction={auction} refresh={refresh} />
          <Activity
            subgraphPool={subgraphData.subgraphPool}
            vault={auctionVaultId}
            showSwaps={false}
          />
        </div>
      </ControllerContextProvider>
    </OracleInfoProvider>
  );
}
