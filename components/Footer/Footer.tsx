import { DISCORD_URL, GITHUB_URL, TWITTER_URL } from 'lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import Bunny from 'public/logos/backed-bunny.png';
import React from 'react';

import styles from './Footer.module.css';

type Link = {
  title: string;
  href: string;
};

const LINKS: Link[] = [
  {
    title: '🤝 Terms of Service',
    href: '/legal/terms-of-service.pdf',
  },
  {
    title: '🔒 Privacy Policy',
    href: '/legal/privacy-policy.pdf',
  },
  {
    title: '💼 Contract Audits',
    href: 'https://github.com/with-backed/papr/tree/master/audits',
  },
  {
    title: '⚙️ GitHub',
    href: GITHUB_URL,
  },
  {
    title: '🐦 Twitter',
    href: TWITTER_URL,
  },
  {
    title: '📣 Discord',
    href: DISCORD_URL,
  },
  {
    title: '🥕 Community NFT 🔨',
    href: 'https://www.withbacked.xyz/community',
  },
];

export function Footer() {
  return (
    <footer className={styles.footer} data-testid="footer">
      <Image src={Bunny} alt="Backed Bunny Logo" height={64} />
      <ul className={styles['footer-links']}>
        {LINKS.map((link) => {
          return (
            <li key={link.title}>
              <Link href={link.href} target="_blank">
                {link.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </footer>
  );
}
