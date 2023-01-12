import controllerStyles from 'components/Controllers/Controller.module.css';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { AuctionPageContent } from 'components/Controllers/AuctionPageContent/AuctionPageContent';
import { ControllerContextProvider, PaprController } from 'hooks/useController';
import { GetServerSideProps } from 'next';
import { configs, getConfig, SupportedToken } from 'lib/config';
import { fetchSubgraphData } from 'lib/PaprController';
import { captureException } from '@sentry/nextjs';
import { OracleInfoProvider } from 'hooks/useOracleInfo/useOracleInfo';
import { Custom404 } from 'components/Custom404';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';
import { auctionById } from 'lib/pAPRSubgraph';

type AuctionProps = {
  subgraphController: PaprController;
  auction: NonNullable<AuctionQuery['auction']>;
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

  const auctionId = context.params?.id as string;
  const auction = await auctionById(auctionId, token);
  if (!auction) {
    const e = new Error(`auction data for auction ${auctionId} not found`);
    captureException(e);
    throw e;
  }

  return {
    props: {
      subgraphController: paprController,
      auction,
    },
  };
};

export default function Auction({ subgraphController, auction }: AuctionProps) {
  const collections = useMemo(
    () => subgraphController.allowedCollateral.map((c) => c.token.id),
    [subgraphController.allowedCollateral],
  );

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
