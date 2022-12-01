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
const prodPages = (
  underlyingAddress: string,
  paprTokenAddress: string,
): Page[] => [
  {
    name: 'Performance',
    route: ``,
    matcher: '',
  },
  {
    name: 'Borrow',
    route: `borrow`,
    matcher: '/borrow',
  },
  {
    name: 'Swap ↗',
    route: `https://app.uniswap.org/#/swap?chain=goerli&inputCurrency=${underlyingAddress}&outputCurrency=${paprTokenAddress}`,
    externalRedirect: true,
  },

  {
    name: 'LP ↗',
    route: `https://app.uniswap.org/#/add/${underlyingAddress}/${paprTokenAddress}/10000?chain=goerli`,
    externalRedirect: true,
  },
];

const paprHeroPages: Page[] = [
  {
    name: 'Competition',
    route: `competition`,
    matcher: 'competition',
  },
];

const stagingPages: Page[] = [];

function isActiveRoute(
  activeRoute: string,
  candidate: Page,
  isHomepage: boolean,
) {
  if (isHomepage) {
    return false;
  }
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
  isHomepage: boolean;
};
function NavLinks({ activeRoute, isHomepage }: NavLinksProps) {
  const { tokenName, underlyingAddress, paprTokenAddress } = useConfig();

  const pages = useMemo(() => {
    const productSpecificPages = tokenName === 'paprHero' ? paprHeroPages : [];
    if (process.env.VERCEL_ENV === 'production') {
      return [
        ...productSpecificPages,
        ...prodPages(underlyingAddress, paprTokenAddress),
      ];
    }
    return [
      ...productSpecificPages,
      ...prodPages(underlyingAddress, paprTokenAddress),
      ...stagingPages,
    ];
  }, [tokenName, underlyingAddress, paprTokenAddress]);

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
                isActiveRoute(activeRoute, p, isHomepage)
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

const SHOW_HEADER_ON_LANDING_PAGE =
  process.env.NEXT_PUBLIC_LANDING_PAGE_HEADER === 'true';

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

  if (
    (activeRoute === '' && !SHOW_HEADER_ON_LANDING_PAGE) ||
    activeRoute === 'errorPage'
  ) {
    return (
      <nav className={styles['logo-only-nav']}>
        <LogoLink />
      </nav>
    );
  }

  const isHomepage = pathname === '/';

  return (
    <nav className={styles.nav}>
      <div className={styles['desktop-content']}>
        <LogoLink />
        <NavLinks activeRoute={activeRoute} isHomepage={isHomepage} />
        <ConnectWallet />
      </div>
      <div className={styles['mobile-content']}>
        <LogoLink />
        <NavLinks activeRoute={activeRoute} isHomepage={isHomepage} />
        <ConnectWallet />
      </div>
    </nav>
  );
}
