import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button, ButtonLink } from 'components/Button';
import { DisplayAddress } from 'components/DisplayAddress';
import { useConfig } from 'hooks/useConfig';
import { pirsch } from 'lib/pirsch';
import React from 'react';
import styles from './ConnectWallet.module.css';

export const ConnectWallet = () => {
  const { network } = useConfig();
  return (
    <ConnectButton.Custom>
      {({ account, openConnectModal }) =>
        !account ? (
          <Button
            onClick={() => {
              pirsch('Wallet connection modal opened', {});
              openConnectModal();
            }}
            type="button"
            kind="dark">
            🥕 Connect
          </Button>
        ) : (
          <ButtonLink
            href={`/network/${network}/profile/${account.address}`}
            kind="dark">
            <span className={styles.address}>
              🔓 <DisplayAddress address={account.address} />
            </span>
          </ButtonLink>
        )
      }
    </ConnectButton.Custom>
  );
};
