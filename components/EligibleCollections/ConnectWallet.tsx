import { ConnectButton } from '@rainbow-me/rainbowkit';
import { TextButton } from 'components/Button';
import { useConfig } from 'hooks/useConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';

import styles from './EligibleCollections.module.css';

const CONNECT_LABEL = 'See your max loan';

export function ConnectWallet() {
  const { address } = useAccount();
  const { tokenName } = useConfig();
  const { push } = useRouter();
  const [connectInitiated, setConnectInitiated] = useState(false);

  const borrowPath = useMemo(() => `/tokens/${tokenName}/borrow`, [tokenName]);

  useEffect(() => {
    if (connectInitiated && address) {
      push(borrowPath);
    }
  }, [address, borrowPath, connectInitiated, push]);

  return (
    <ConnectButton.Custom>
      {({ account, openConnectModal }) =>
        !account ? (
          <TextButton
            onClick={() => {
              setConnectInitiated(true);
              openConnectModal();
            }}
            className={styles['connect-button']}>
            {CONNECT_LABEL}
          </TextButton>
        ) : (
          <Link className={styles.link} href={borrowPath}>
            {CONNECT_LABEL}
          </Link>
        )
      }
    </ConnectButton.Custom>
  );
}
