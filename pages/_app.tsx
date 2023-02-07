import '@rainbow-me/rainbowkit/styles.css';
import 'normalize.css';
import 'styles/fonts-maru.css';
import 'styles/global.css';

import { ApplicationProviders } from 'components/ApplicationProviders';
import { AppWrapper } from 'components/layouts/AppWrapper';
import { ConfigProvider } from 'hooks/useConfig';
import { isSupportedToken, SupportedToken } from 'lib/config';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const TOKEN_FROM_PATH_REGEXP = /\/tokens\/([^/]+)/;
function tokenFromPath(path: string): SupportedToken {
  const match = path.match(TOKEN_FROM_PATH_REGEXP);
  if (match && isSupportedToken(match[1])) {
    return match[1];
  }
  // For the time being, the "default network" (e.g. on the home page)
  // is paprHero. We will change to paprMeme when that launches.
  return 'paprHero';
}

const ErrorBanners = dynamic(() =>
  import('components/ErrorBanners').then((mod) => mod.ErrorBanners),
);
const Footer = dynamic(() =>
  import('components/Footer').then((mod) => mod.Footer),
);
const Header = dynamic(() =>
  import('components/Header').then((mod) => mod.Header),
);

export default function App({ Component, pageProps }: AppProps) {
  const { asPath } = useRouter();
  const [token, setToken] = useState<SupportedToken>(
    tokenFromPath(asPath) as SupportedToken,
  );

  useEffect(() => {
    const newPath = tokenFromPath(asPath);
    if (newPath !== token) {
      setToken(newPath as SupportedToken);
    }
  }, [asPath, token]);

  return (
    <ConfigProvider token={token}>
      <ApplicationProviders>
        <AppWrapper>
          <ErrorBanners />
          <Header />
          <Component {...pageProps} />
          <Footer />
        </AppWrapper>
      </ApplicationProviders>
    </ConfigProvider>
  );
}
