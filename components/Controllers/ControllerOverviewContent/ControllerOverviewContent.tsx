import React from 'react';
import styles from 'components/Controllers/Controller.module.css';
import { ControllerPricesData } from 'lib/controllers/charts';
import { PaprController } from 'lib/PaprController';
import { Collateral } from 'components/Controllers/Collateral';
import { Activity } from 'components/Controllers/Activity';
import { Loans } from 'components/Controllers/Loans';
import { TokenPerformance } from 'components/Controllers/TokenPerformance';
import dynamic from 'next/dynamic';
import { YourPositions } from 'components/Controllers/YourPositions';

/* lightweight-charts uses canvas and cannot be SSRed */
const Charts = dynamic(() => import('components/Controllers/Charts/Charts'), {
  ssr: false,
});

export type ControllerPageProps = {
  address: string;
  paprController: PaprController;
  pricesData: ControllerPricesData | null;
};

export function ControllerOverviewContent({
  address,
  paprController,
  pricesData,
}: ControllerPageProps) {
  const latestMarketPrice =
    pricesData?.markValues[pricesData?.markValues.length - 1].value;

  return (
    <div className={styles.wrapper}>
      <YourPositions
        paprController={paprController}
        latestMarketPrice={latestMarketPrice}
      />
      <TokenPerformance
        pricesData={{ [paprController.id]: pricesData }}
        strategies={[paprController]}
      />
      <Collateral paprController={paprController} />
      <Activity paprController={paprController} />
      <Charts pricesData={pricesData} />
      <Loans paprController={paprController} pricesData={pricesData} />
    </div>
  );
}
