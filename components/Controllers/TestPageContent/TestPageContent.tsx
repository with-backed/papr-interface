import React, { useMemo } from 'react';
import controllerStyles from 'components/Controllers/Controller.module.css';
import styles from './TestPageContent.module.css';
import MintERC20 from './MintERC20';
import MintCollateral from './MintCollateral';
import { erc721Contract } from 'lib/contracts';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { useController } from 'hooks/useController';

export function TestPageContent() {
  const signerOrProvider = useSignerOrProvider();
  const controller = useController();

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
