import React, { useMemo } from 'react';
import controllerStyles from 'components/Controllers/Controller.module.css';
import styles from './TestPageContent.module.css';
import MintERC20 from './MintERC20';
import MintCollateral from './MintCollateral';
import { PaprController } from 'lib/PaprController';
import { erc721Contract } from 'lib/contracts';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';

type TestPageContentProps = {
  paprController: PaprController;
};

export function TestPageContent({ paprController }: TestPageContentProps) {
  const signerOrProvider = useSignerOrProvider();
  const collateral = useMemo(
    () =>
      paprController.allowedCollateral.map((ac) =>
        erc721Contract(ac.contractAddress, signerOrProvider),
      ),
    [paprController.allowedCollateral, signerOrProvider],
  );
  return (
    <div className={controllerStyles.wrapper}>
      <div className={styles.wrapper}>
        <div className={controllerStyles.column}>
          <MintERC20 token={paprController.underlying} />
          {collateral.map((c) => (
            <MintCollateral token={c} key={c.address} />
          ))}
        </div>
      </div>
    </div>
  );
}
