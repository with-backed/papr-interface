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
const prodPages = (controllerAddress: string): Page[] => [
  {
    name: 'Performance',
    route: `controllers/${controllerAddress}`,
    matcher: 'controllers/[controller]',
  },
  {
    name: 'Borrow',
    route: `controllers/${controllerAddress}/borrow`,
    matcher: 'controllers/[controller]/borrow',
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

const paprHeroPages: Page[] = [
  {
    name: 'Contest',
    route: `/contest`,
    matcher: 'contest',
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
  const { tokenName, controllerAddress } = useConfig();

  const pages = useMemo(() => {
    const productSpecificPages = tokenName === 'paprHero' ? paprHeroPages : [];
    if (process.env.VERCEL_ENV === 'production') {
      return [...productSpecificPages, ...prodPages(controllerAddress!)];
    }
    return [
      ...productSpecificPages,
      ...prodPages(controllerAddress!),
      ...stagingPages,
    ];
  }, [controllerAddress, tokenName]);

  return (
    <ul className={styles.links}>
      <li className={styles.entry}>${tokenName}:</li>
      {pages.map((p) => (
        <li key={p.name}>
          <Link
            href={
              p.isNetworkSpecialCase
                ? `/${p.route}`
                : p.externalRedirect
                ? p.route
                : `/tokens/${tokenName}/${p.route}`
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
  return (
    <Link href={`/`} passHref>
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
    return pathname.split('[token]/')[1] || '';
  }, [pathname]);

  if (activeRoute === '' || activeRoute === 'errorPage') {
    return (
      <nav className={styles['logo-only-nav']}>
        <LogoLink />
      </nav>
    );
  }

  return (
    <nav className={styles.nav}>
      <div className={styles['desktop-content']}>
        <LogoLink />
        <NavLinks activeRoute={activeRoute} />
        <ConnectWallet />
      </div>
      <div className={styles['mobile-content']}>
        <div className={styles.center}>
          <LogoLink />
        </div>
      </div>
    </nav>
  );
}
