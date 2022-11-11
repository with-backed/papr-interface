import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from 'components/Button';
import { DisplayAddress } from 'components/DisplayAddress';
import { pirsch } from 'lib/pirsch';
import React from 'react';
import styles from './ConnectWallet.module.css';

export const ConnectWallet = () => {
  return (
    <ConnectButton.Custom>
      {({ account, openConnectModal, openAccountModal }) =>
        !account ? (
          <Button
            onClick={() => {
              pirsch('Wallet connection modal opened', {});
              openConnectModal();
            }}
            kind="regular"
            theme="white"
            size="small">
            🥕 Connect
          </Button>
        ) : (
          <Button
            onClick={openAccountModal}
            kind="regular"
            theme="white"
            size="small">
            <span className={styles.address}>
              🔓 <DisplayAddress address={account.address} />
            </span>
          </Button>
        )
      }
    </ConnectButton.Custom>
  );
};
