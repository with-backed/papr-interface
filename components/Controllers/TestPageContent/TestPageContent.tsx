import controllerStyles from 'components/Controllers/Controller.module.css';
import { useController } from 'hooks/useController';
import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { erc721Contract } from 'lib/contracts';
import React, { useMemo } from 'react';

import MintCollateral from './MintCollateral';
import MintERC20 from './MintERC20';
import styles from './TestPageContent.module.css';

export function TestPageContent() {
  const signerOrProvider = useSignerOrProvider();
  const controller = useController();
  const thing = useControllerPricesData();
  console.log({ thing });

  const collateral = useMemo(
    () =>
      controller.allowedCollateral.map((ac) =>
        erc721Contract(ac.token.id, signerOrProvider),
      ) || [],
    [controller, signerOrProvider],
  );

  return (
    <div className={controllerStyles.wrapper}>
      <div className={styles.wrapper}>
        <div className={controllerStyles.column}>
          {!!controller && <MintERC20 token={controller.underlying} />}
          {collateral.map((c) => (
            <MintCollateral token={c} key={c.address} />
          ))}
        </div>
      </div>
    </div>
  );
}
