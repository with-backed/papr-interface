import { ConnectWallet } from 'components/ConnectWallet';
import { PaprMEME } from 'components/Icons/PaprMEME';
import { Logo } from 'components/Logo';
import { useConfig } from 'hooks/useConfig';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import styles from './Header.module.css';
import paprLogo from 'public/logos/papr-logo.png';

type Page = {
  name: string;
  route: string;
  matcher?: string;
  // Some pages (about, community) don't fit into our resource-oriented hierarchy.
  // We'll just put them at the top-level
  isNetworkSpecialCase?: boolean;
  externalRedirect?: boolean;
};
const prodPages = (strategyAddress: string): Page[] => [
  {
    name: 'Performance',
    route: `strategies/${strategyAddress}`,
    matcher: 'strategies/[strategy]',
  },
  {
    name: 'Borrow',
    route: `strategies/${strategyAddress}/borrow`,
    matcher: 'strategies/[strategy]/borrow',
  },
  {
    name: 'Swap ↗',
    route:
      'https://app.uniswap.org/#/swap?chain=goerli&inputCurrency=0x3089b47853df1b82877beef6d904a0ce98a12553&outputCurrency=0xb5e5f51e3e112634975fb44e6351380413f653ac',
    externalRedirect: true,
  },

  {
    name: 'LP ↗',
    route:
      'https://app.uniswap.org/#/add/0x3089B47853df1b82877bEef6D904a0ce98a12553/0x4a783cb0adb6403a739f907131f8788b40dc7678/10000?chain=goerli',
    externalRedirect: true,
  },
];

const stagingPages: Page[] = [];

function isActiveRoute(activeRoute: string, candidate: Page) {
  if (candidate.route.length === 0) {
    return activeRoute.length === 0;
  }

  if (candidate.matcher) {
    return activeRoute === candidate.matcher;
  }

  return activeRoute.startsWith(candidate.route);
}

type NavLinksProps = {
  activeRoute: string;
};
function NavLinks({ activeRoute }: NavLinksProps) {
  const { network, strategyAddress } = useConfig();

  const pages = useMemo(() => {
    if (process.env.VERCEL_ENV === 'production') {
      return prodPages(strategyAddress!);
    }
    return [...prodPages(strategyAddress!), ...stagingPages];
  }, [strategyAddress]);

  return (
    <ul className={styles.links}>
      {pages.map((p) => (
        <li key={p.name}>
          <Link
            href={
              p.isNetworkSpecialCase
                ? `/${p.route}`
                : p.externalRedirect
                ? p.route
                : `/networks/${network}/${p.route}`
            }>
            <a
              className={
                isActiveRoute(activeRoute, p)
                  ? styles['link-active']
                  : styles.link
              }
              target={p.externalRedirect ? '_blank' : ''}>
              {p.name}
            </a>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function LogoLink() {
  const { network } = useConfig();

  return (
    <Link href={`/networks/${network}/`} passHref>
      <a title="papr">
        <img className={styles.logo} src={paprLogo.src} alt="" />
      </a>
    </Link>
  );
}

export function Header() {
  const { pathname } = useRouter();

  const activeRoute = useMemo(() => {
    // Handling these since they aren't network-namespaced
    if (pathname === '/404' || pathname === '/500') {
      return 'errorPage';
    }
    if (pathname.startsWith('/community') || pathname === '/about') {
      return pathname.substring(1);
    }
    return pathname.split('[network]/')[1] || '';
  }, [pathname]);

  return (
    <nav className={styles.nav}>
      <div className={styles.content}>
        <div className={styles['left-side']}>
          <LogoLink />
        </div>
        <div className={styles.center}>
          <NavLinks activeRoute={activeRoute} />
        </div>
        <div className={styles['right-side']}>
          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
}
