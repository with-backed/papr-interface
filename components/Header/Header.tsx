import { ConnectWallet } from 'components/ConnectWallet';
import { useConfig } from 'hooks/useConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import styles from './Header.module.css';
import paprLogo from 'public/logos/papr-logo.png';
import paprTitle from 'public/logos/papr-title.png';
import paprMemeTitle from 'public/logos/paprMEME-title.png';
import paprHeroTitle from 'public/logos/paprHERO-title.png';
import paprTrashTitle from 'public/logos/paprTRASH-title.png';
import { useTheme } from 'hooks/useTheme';
import Head from 'next/head';
import Image from 'next/image';
import { SupportedToken } from 'lib/config';

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
                isActiveRoute(activeRoute, p, isHomePage)
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
    <Link href={`/`} passHref>
      <a title="papr">
        <div className={styles.logo}>
          <Image src={image} alt="" placeholder="blur" />
        </div>
      </a>
    </Link>
  );
}

const SHOW_HEADER_ON_LANDING_PAGE =
  process.env.NEXT_PUBLIC_LANDING_PAGE_HEADER === 'true';

export function Header() {
  const { mainTheme } = useTheme();
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

  const isHomePage = useMemo(
    () => activeRoute === '' || activeRoute === 'errorPage',
    [activeRoute],
  );

  if (
    (activeRoute === '' && !SHOW_HEADER_ON_LANDING_PAGE) ||
    activeRoute === 'errorPage'
  ) {
    return (
      <nav className={styles['logo-only-nav']}>
        <LogoLink isHomePage={isHomePage} />
      </nav>
    );
  }

  return (
    <nav className={[styles.nav, styles[mainTheme]].join(' ')}>
      <div className={styles['desktop-content']}>
        <LogoLink isHomePage={isHomePage} />
        <NavLinks activeRoute={activeRoute} isHomePage={isHomePage} />
        <ConnectWallet />
      </div>
      <div className={styles['mobile-content']}>
        <LogoLink isHomePage={isHomePage} />
        <NavLinks activeRoute={activeRoute} isHomePage={isHomePage} />
        <ConnectWallet />
      </div>
      <Head>
        <style>
          {mainTheme === 'paprHero'
            ? `
          :root {
            --table-zebra-stripe: var(--heroes-red);
          }
          `
            : `
          :root {
            --table-zebra-stripe: var(--background-faded-green);
          }
          `}
        </style>
      </Head>
    </nav>
  );
}
