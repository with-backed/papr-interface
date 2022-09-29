import { Button, TextButton } from 'components/Button';
import { ConnectWallet } from 'components/ConnectWallet';
import { Logo } from 'components/Logo';
import { useConfig } from 'hooks/useConfig';
import { useOnClickOutside } from 'hooks/useOnClickOutside';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import styles from './Header.module.css';

type Page = {
  name: string;
  route: string;
  // Some pages (about, community) don't fit into our resource-oriented hierarchy.
  // We'll just put them at the top-level
  isNetworkSpecialCase?: boolean;
  externalRedirect?: boolean;
};
const prodPages = (strategyAddress: string): Page[] => [
  {
    name: 'Strategy',
    route: `strategies/${strategyAddress}`,
  },
  {
    name: 'Borrow',
    route: `strategies/${strategyAddress}/borrow`,
  },
  {
    name: 'Swap',
    route:
      'https://app.uniswap.org/#/swap?chain=goerli&inputCurrency=0x3089b47853df1b82877beef6d904a0ce98a12553&outputCurrency=0xb5e5f51e3e112634975fb44e6351380413f653ac',
    externalRedirect: true,
  },
  {
    name: 'LP',
    route:
      'https://app.uniswap.org/#/add/0x3089B47853df1b82877bEef6D904a0ce98a12553/0xb5e5f51E3E112634975Fb44e6351380413F653aC/10000?chain=goerli',
    externalRedirect: true,
  },
  {
    name: 'Mint Test NFTs',
    route: `/strategies/${strategyAddress}/test`,
  },
];

const stagingPages: Page[] = [];

function isActiveRoute(activeRoute: string, candidate: string) {
  if (candidate.length === 0) {
    return activeRoute.length === 0;
  }

  return activeRoute.startsWith(candidate);
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
                isActiveRoute(activeRoute, p.route)
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
  const { pathname } = useRouter();

  const isErrorPage = useMemo(
    () => pathname === '/404' || pathname === '/500',
    [pathname],
  );

  return (
    <Link href={`/networks/${network}/`} passHref>
      <a title="Backed">
        <Logo error={isErrorPage} />
      </a>
    </Link>
  );
}

type MobileMenuProps = {
  activeRoute: string;
  closeMobileMenu: () => void;
  mobileMenuNode: React.RefObject<HTMLDivElement>;
  mobileMenuOpen: boolean;
};
function MobileMenu({
  activeRoute,
  closeMobileMenu,
  mobileMenuNode,
  mobileMenuOpen,
}: MobileMenuProps) {
  return (
    <div
      className={
        mobileMenuOpen ? styles['mobile-nav-open'] : styles['mobile-nav']
      }>
      <div ref={mobileMenuNode} className={styles['mobile-menu-buttons']}>
        <NavLinks activeRoute={activeRoute} />
        <ConnectWallet />
        <TextButton onClick={closeMobileMenu}>Close</TextButton>
      </div>
    </div>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const mobileMenuNode = useRef<HTMLDivElement>(null);
  useOnClickOutside(mobileMenuNode, () => setMobileMenuOpen(false));
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
        <div className={styles['desktop-header']}>
          <div className={styles['left-side']}>
            <LogoLink />
            <NavLinks activeRoute={activeRoute} />
          </div>
          <div className={styles.controls}>
            <ConnectWallet />
          </div>
        </div>

        <div className={styles['mobile-header']}>
          <div className={styles['left-side']}>
            <LogoLink />
          </div>
          <div className={styles.controls}>
            <Button
              onClick={mobileMenuOpen ? closeMobileMenu : openMobileMenu}
              kind={mobileMenuOpen ? 'secondary' : 'primary'}>
              🍔 Menu
            </Button>
          </div>
        </div>
        <MobileMenu
          activeRoute={activeRoute}
          closeMobileMenu={closeMobileMenu}
          mobileMenuNode={mobileMenuNode}
          mobileMenuOpen={mobileMenuOpen}
        />
      </div>
    </nav>
  );
}
