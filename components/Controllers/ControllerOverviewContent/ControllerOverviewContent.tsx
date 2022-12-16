import { Activity } from 'components/Controllers/Activity';
import { Auctions } from 'components/Controllers/Auctions';
import { Collateral as CollateralComponent } from 'components/Controllers/Collateral';
import styles from 'components/Controllers/Controller.module.css';
import { Loans as LoansComponent } from 'components/Controllers/Loans';
import { TokenPerformance } from 'components/Controllers/TokenPerformance';
import { YourPositions as YourPositionsComponent } from 'components/YourPositions';
import { useAccountNFTs } from 'hooks/useAccountNFTs';
import { useConfig } from 'hooks/useConfig';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { usePaprBalance } from 'hooks/usePaprBalance';
import { ControllerPricesData } from 'lib/controllers/charts';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { PaprController } from 'lib/PaprController';
import dynamic from 'next/dynamic';
import React, { ComponentProps, useMemo } from 'react';
import { useAccount } from 'wagmi';

/* lightweight-charts uses canvas and cannot be SSRed */
const Charts = dynamic(() => import('components/Controllers/Charts/Charts'), {
  ssr: false,
});
const YourPositions = dynamic<ComponentProps<typeof YourPositionsComponent>>(
  () => import('components/YourPositions').then((mod) => mod.YourPositions),
  {
    ssr: false,
  },
);
const Loans = dynamic<ComponentProps<typeof LoansComponent>>(
  import('components/Controllers/Loans').then((mod) => mod.Loans),
  {
    ssr: false,
  },
);
const Collateral = dynamic<ComponentProps<typeof CollateralComponent>>(
  import('components/Controllers/Collateral').then((mod) => mod.Collateral),
  {
    ssr: false,
  },
);

export type ControllerPageProps = {
  paprController: PaprController;
  pricesData: ControllerPricesData | null;
};

export function ControllerOverviewContent({
  paprController,
  pricesData,
}: ControllerPageProps) {
  const config = useConfig();
  const { address } = useAccount();
  const oracleInfo = useOracleInfo(OraclePriceType.lower);
  const latestMarketPrice =
    pricesData?.markValues[pricesData?.markValues.length - 1]?.value || 1.0;

  const { currentVaults, vaultsFetching } = useCurrentVaults(
    paprController,
    address,
  );

  const collateralContractAddresses = useMemo(() => {
    return paprController.allowedCollateral.map((ac) => ac.contractAddress);
  }, [paprController.allowedCollateral]);

  const { userCollectionNFTs, nftsLoading } = useAccountNFTs(
    address,
    collateralContractAddresses,
    config,
  );

  const { balance } = usePaprBalance(paprController.debtToken.id);

  return (
    <div className={styles.wrapper}>
      {oracleInfo && !vaultsFetching && !nftsLoading && (
        <YourPositions
          currentVaults={currentVaults}
          latestMarketPrice={latestMarketPrice}
          oracleInfo={oracleInfo}
          paprController={paprController}
          userNFTs={userCollectionNFTs}
          balance={balance}
        />
      )}
      <TokenPerformance
        pricesData={{ [paprController.id]: pricesData }}
        controllers={[paprController]}
      />
      <Collateral paprController={paprController} />
      <Activity paprController={paprController} />
      <Charts pricesData={pricesData} />
      <Loans paprController={paprController} pricesData={pricesData} />
      <Auctions paprController={paprController} />
    </div>
  );
}
