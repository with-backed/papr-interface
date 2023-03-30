import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import {
  OracleInfoProvider,
  useOracleInfo,
} from 'hooks/useOracleInfo/useOracleInfo';
import { useTarget } from 'hooks/useTarget';
import { SECONDS_IN_A_YEAR } from 'lib/constants';
import { formatPercent } from 'lib/numberFormat';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { SubgraphController } from 'lib/PaprController';
import { subgraphControllerByAddress } from 'lib/pAPRSubgraph';
import { percentChange } from 'lib/tokenPerformance';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import Marquee from 'react-fast-marquee';

import { Collection } from './Collection';
import { COLLECTIONS } from './constants';
import styles from './EligibleCollections.module.css';

const ConnectWallet = dynamic(() =>
  import('./ConnectWallet').then((mod) => mod.ConnectWallet),
);

export function EligibleCollections() {
  const collections = useMemo(() => COLLECTIONS.map((c) => c.address), []);
  return (
    <OracleInfoProvider collections={collections}>
      <EligibleCollectionsInner />
    </OracleInfoProvider>
  );
}

export function EligibleCollectionsInner() {
  const config = useConfig();
  const subgraphData = useAsyncValue(
    () => subgraphControllerByAddress(config.controllerAddress, 'paprMeme'),
    [config],
  );
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const targetResult = useTarget();

  return (
    <div className={styles.wrapper}>
      <APR paprController={subgraphData?.paprController} />
      <Marquee className={styles.marquee} pauseOnHover gradient={false}>
        {COLLECTIONS.map((c) => (
          <Collection
            paprController={subgraphData?.paprController}
            oracleInfo={oracleInfo}
            targetResult={targetResult}
            key={c.address + '-1'}
            collectionInfo={c}
          />
        ))}
        {COLLECTIONS.map((c) => (
          <Collection
            paprController={subgraphData?.paprController}
            oracleInfo={oracleInfo}
            targetResult={targetResult}
            key={c.address + '-2'}
            collectionInfo={c}
          />
        ))}
      </Marquee>
    </div>
  );
}

type APRProps = {
  paprController?: SubgraphController | null;
};

function APR({ paprController }: APRProps) {
  const newTargetResult = useTarget();

  const currentTargetNumber = useMemo(() => {
    if (paprController) {
      return parseFloat(
        ethers.utils.formatUnits(
          paprController.currentTarget,
          paprController.underlying.decimals,
        ),
      );
    }
    return null;
  }, [paprController]);

  const newTargetNumber = useMemo(() => {
    if (!newTargetResult || !paprController) {
      return null;
    }
    return parseFloat(
      ethers.utils.formatUnits(
        newTargetResult.target,
        paprController.underlying.decimals,
      ),
    );
  }, [newTargetResult, paprController]);

  const contractAPR = useMemo(() => {
    if (
      !newTargetResult ||
      !newTargetNumber ||
      !currentTargetNumber ||
      !paprController
    ) {
      return null;
    }
    const change = percentChange(currentTargetNumber, newTargetNumber);
    // convert to APR
    return formatPercent(
      (change /
        (newTargetResult.timestamp - paprController.currentTargetUpdated)) *
        SECONDS_IN_A_YEAR,
    );
  }, [newTargetNumber, currentTargetNumber, newTargetResult, paprController]);

  return (
    <div className={styles.bubble}>
      <span>
        <ConnectWallet />. paprMEME makes instant{' '}
        <span className={styles.green}>loans at {contractAPR || '...%'}</span>{' '}
        for meme collections, up to:
      </span>
    </div>
  );
}
