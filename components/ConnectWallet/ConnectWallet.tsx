import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from 'components/Button';
import { DisplayAddress } from 'components/DisplayAddress';
import { useTheme } from 'hooks/useTheme';
import { pirsch } from 'lib/pirsch';
import React from 'react';

import styles from './ConnectWallet.module.css';

export const ConnectWallet = () => {
  const theme = useTheme();
  return (
    <ConnectButton.Custom>
      {({ account, openConnectModal, openAccountModal }) =>
        !account ? (
          <Button
            onClick={() => {
              pirsch('Wallet connection modal opened', {});
              openConnectModal();
            }}
            kind="white"
            theme={theme}
            size="small">
            🥕 Connect
          </Button>
        ) : (
          <Button
            onClick={openAccountModal}
            kind="white"
            theme={theme}
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
