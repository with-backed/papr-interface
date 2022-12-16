import { useConfig } from 'hooks/useConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { ComponentProps, useCallback, useMemo, useState } from 'react';
import styles from './Header.module.css';
import paprTitle from 'public/logos/papr-title.png';
import paprMemeTitle from 'public/logos/paprMEME-title.png';
import paprHeroTitle from 'public/logos/paprHERO-title.png';
import paprTrashTitle from 'public/logos/paprTRASH-title.png';
import { useTheme } from 'hooks/useTheme';
import Image, { StaticImageData } from 'next/legacy/image';
import { SupportedToken } from 'lib/config';
import dynamic from 'next/dynamic';
import { ConnectWallet as ConnectWalletComponent } from 'components/ConnectWallet';
import { Button } from 'components/Button';
import {
  useDisclosureState,
  Disclosure,
  DisclosureContent,
} from 'reakit/Disclosure';

const ConnectWallet = dynamic<ComponentProps<typeof ConnectWalletComponent>>(
  () => import('components/ConnectWallet').then((mod) => mod.ConnectWallet),
  { ssr: false },
);

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
    matcher: 'borrow',
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

const paprHeroPages: Page[] = [];

const stagingPages: Page[] = [];

function isActiveRoute(
  activeRoute: string,
  candidate: Page,
  isHomePage: boolean,
) {
  if (isHomePage) {
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
  isHomePage: boolean;
};
function NavLinks({ activeRoute, isHomePage }: NavLinksProps) {
  const { tokenName, underlyingAddress, paprTokenAddress } = useConfig();
  const theme = useTheme();

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
            }
            className={
              isActiveRoute(activeRoute, p, isHomePage)
                ? [styles.link, styles['link-active'], styles[theme]].join(' ')
                : [styles.link, styles[theme]].join(' ')
            }
            target={p.externalRedirect ? '_blank' : ''}>
            {p.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const imageLookup: { [key in SupportedToken]: StaticImageData } = {
  paprMeme: paprMemeTitle,
  paprHero: paprHeroTitle,
  paprTrash: paprTrashTitle,
};

function LogoLink({ isHomePage }: { isHomePage: boolean }) {
  const { tokenName } = useConfig();
  const image = useMemo(() => {
    if (isHomePage) {
      return paprTitle;
    }
    return imageLookup[tokenName as SupportedToken];
  }, [isHomePage, tokenName]);
  return (
    <Link href={`/`} passHref title="papr">
      <div className={styles.logo}>
        <Image src={image} alt="" placeholder="blur" />
      </div>
    </Link>
  );
}

const SHOW_HEADER_ON_LANDING_PAGE =
  process.env.NEXT_PUBLIC_LANDING_PAGE_HEADER === 'true';

export function Header() {
  const theme = useTheme();
  const { pathname } = useRouter();
  const mobileLinks = useDisclosureState({ visible: false });

  const handleMenuClick = useCallback(() => {
    mobileLinks.toggle();
  }, [mobileLinks]);

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

  const isHomePage = useMemo(
    () => pathname === '/' || activeRoute === 'errorPage',
    [activeRoute, pathname],
  );

  if (
    (isHomePage && !SHOW_HEADER_ON_LANDING_PAGE) ||
    activeRoute === 'errorPage'
  ) {
    return (
      <nav className={[styles['logo-only-nav'], styles.papr].join(' ')}>
        <LogoLink isHomePage={isHomePage} />
      </nav>
    );
  }

  return (
    <nav
      className={[
        styles.nav,
        isHomePage ? styles.homepage : styles[theme],
      ].join(' ')}>
      <div className={styles['desktop-content']}>
        <LogoLink isHomePage={isHomePage} />
        <NavLinks activeRoute={activeRoute} isHomePage={isHomePage} />
        <ConnectWallet />
      </div>
      <div className={styles['mobile-content']}>
        <div className={styles.controls}>
          <LogoLink isHomePage={isHomePage} />
          <Disclosure
            as={Button}
            kind="white"
            size="small"
            onClick={handleMenuClick}>
            🧻 Menu
          </Disclosure>
        </div>
        <DisclosureContent {...mobileLinks}>
          <NavLinks activeRoute={activeRoute} isHomePage={isHomePage} />
          <ConnectWallet />
        </DisclosureContent>
      </div>
    </nav>
  );
}
