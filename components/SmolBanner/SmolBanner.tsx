import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import Marquee from 'react-fast-marquee';

import styles from './SmolBanner.module.css';

const TEXT =
  'Sounds neat but too complicated? 👀 Try borrowing on adventure.papr.wtf 🐣 ELI5 VERSION 💡';

export function SmolBanner() {
  const { pathname } = useRouter();
  const isHomePage = useMemo(() => pathname === '/', [pathname]);

  if (!isHomePage) {
    return null;
  }

  return (
    <Link
      href="https://adventure.papr.wtf"
      target="_blank"
      className={styles.wrapper}>
      <Marquee gradient={false} autoFill speed={15}>
        <span className={styles.text}>{TEXT}</span>
      </Marquee>
    </Link>
  );
}
