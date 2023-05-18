import Link from 'next/link';

import styles from './SmolBanner.module.css';

const TEXT =
  '💡 Sounds neat but too complicated? 😵‍💫 Try papr.adventure.wtf 👀 ELI5 VERSION 🐣';

export function SmolBanner() {
  return (
    <Link
      href="https://adventure.papr.wtf"
      target="_blank"
      className={styles.wrapper}>
      {TEXT}
    </Link>
  );
}
