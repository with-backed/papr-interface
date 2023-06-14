import Image from 'next/image';
import Link from 'next/link';
import AngelBunny from 'public/angelbunny-XL.png';

import styles from './Shutdown.module.css';

const ANNOUNCEMENT_URL =
  'https://backed.mirror.xyz/Y7aaIAo8TG9vVCYp1X0bJBTC0wEGR3OS57iMUG3DyCg';

export function Shutdown() {
  return (
    <div className={styles.wrapper}>
      <Image height={117} src={AngelBunny} alt="" priority placeholder="blur" />
      <div>
        <p>
          This interface will go offline September 1, 2023. The protocol will
          continue to operate. Read{' '}
          <Link className={styles.link} href={ANNOUNCEMENT_URL} target="_blank">
            the announcement
          </Link>{' '}
          for more details .
        </p>
      </div>
    </div>
  );
}
