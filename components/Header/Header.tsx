import { ConnectWallet } from 'components/ConnectWallet';
import { useConfig } from 'hooks/useConfig';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import styles from './Header.module.css';
import paprLogo from 'public/logos/papr-logo.png';
import { configs, SupportedToken } from 'lib/config';
import { fetchSubgraphData } from 'lib/PaprController';
import { useAsyncValue } from 'hooks/useAsyncValue';

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
  controller?: string,
  paprToken?: string,
  underlying?: string,
): Page[] => [
  {
    name: 'Performance',
    route: `controllers/${controller}`,
    matcher: 'controllers/[controller]',
  },
  {
    name: 'Borrow',
    route: `controllers/${controller}/borrow`,
    matcher: 'controllers/[controller]/borrow',
  },
  {
    name: 'Swap ↗',
    route: `https://app.uniswap.org/#/swap?chain=goerli&inputCurrency=${underlying}&outputCurrency=${paprToken}`,
    externalRedirect: true,
  },

  {
    name: 'LP ↗',
    route: `https://app.uniswap.org/#/add/${underlying}/${paprToken}/10000?chain=goerli`,
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

  const paprController = useAsyncValue(() => {
    return fetchSubgraphData(
      configs[tokenName as SupportedToken].controllerAddress,
      configs[tokenName as SupportedToken].uniswapSubgraph,
      tokenName as SupportedToken,
    );
  }, [tokenName]);

  console.log({ paprController });

  const pages = useMemo(() => {
    const productSpecificPages = tokenName === 'paprHero' ? paprHeroPages : [];
    if (process.env.VERCEL_ENV === 'production') {
      return [
        ...productSpecificPages,
        ...prodPages(
          paprController?.paprController.id,
          paprController?.paprController.paprToken,
          paprController?.paprController.underlying,
        ),
      ];
    }
    return [
      ...productSpecificPages,
      ...prodPages(
        paprController?.paprController.id,
        paprController?.paprController.paprToken,
        paprController?.paprController.underlying,
      ),
      ...stagingPages,
    ];
  }, [
    tokenName,
    paprController?.paprController.id,
    paprController?.paprController.paprToken,
    paprController?.paprController.underlying,
  ]);

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

  return (
    <nav className={styles.nav}>
      <div className={styles['desktop-content']}>
        <LogoLink />
        <NavLinks activeRoute={activeRoute} />
        <ConnectWallet />
      </div>
      <div className={styles['mobile-content']}>
        <LogoLink />
        <NavLinks activeRoute={activeRoute} />
        <ConnectWallet />
      </div>
    </nav>
  );
}
