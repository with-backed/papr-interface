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
          The Backed protocol is stopping active development. This interface
          will be taken offline on September 1, 2023. Read{' '}
          <Link className={styles.link} href={ANNOUNCEMENT_URL} target="_blank">
            the announcement
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
