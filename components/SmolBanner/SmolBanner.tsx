import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import styles from './SmolBanner.module.css';

const TEXT =
  '💡 Sounds neat but too complicated? 😵‍💫 Try papr.adventure.wtf 👀 ELI5 VERSION 🐣';

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
      {TEXT}
    </Link>
  );
}
