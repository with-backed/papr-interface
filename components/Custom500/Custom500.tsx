import { DISCORD_ERROR_CHANNEL, DISCORD_URL } from 'lib/constants';
import Link from 'next/link';

import styles from './Custom500.module.css';

export function Custom500() {
  return (
    <div className={styles.div}>
      <p>{'We are having trouble loading this page.'}</p>
      <p>
        {'If refreshing does not work, let us know in '}

        <Link href={DISCORD_URL} passHref target={'_blank'} rel="noreferrer">
          {DISCORD_ERROR_CHANNEL} on Discord.
        </Link>
      </p>
    </div>
  );
}
