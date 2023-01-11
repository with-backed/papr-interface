import controllerStyles from 'components/Controllers/Controller.module.css';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import {
  AuctionDocument,
  AuctionQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import { AuctionPageContent } from 'components/Controllers/AuctionPageContent/AuctionPageContent';
import { ControllerContextProvider, PaprController } from 'hooks/useController';
import { GetServerSideProps } from 'next';
import { configs, getConfig, SupportedToken } from 'lib/config';
import { fetchSubgraphData } from 'lib/PaprController';
import { captureException } from '@sentry/nextjs';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';

type AuctionProps = {
  subgraphController: PaprController;
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

  const { paprController } = controllerSubgraphData;

  return {
    props: {
      subgraphController: paprController,
    },
  };
};

export default function Auction({ subgraphController }: AuctionProps) {
  const id = useRouter().query.id;

  const [{ data: auctionQueryResult }] = useQuery<AuctionQuery>({
    query: AuctionDocument,
    variables: { id },
  });

  const auction = useMemo(() => {
    if (!auctionQueryResult?.auction) return undefined;
    return auctionQueryResult.auction;
  }, [auctionQueryResult]);

  const collections = useMemo(
    () => subgraphController.allowedCollateral.map((c) => c.token.id),
    [subgraphController.allowedCollateral],
  );

  if (!auction) return <div></div>;

  return (
    <OracleInfoProvider collections={collections}>
      <ControllerContextProvider value={subgraphController}>
        <div className={controllerStyles.wrapper}>
          <AuctionPageContent auction={auction} />
        </div>
      </ControllerContextProvider>
    </OracleInfoProvider>
  );
}
