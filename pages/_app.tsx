import 'styles/global.css';
import 'styles/fonts-maru.css';
import 'normalize.css';
import '@rainbow-me/rainbowkit/styles.css';
import { AppProps } from 'next/app';
import { AppWrapper } from 'components/layouts/AppWrapper';
import { Footer } from 'components/Footer';
import { ConfigProvider } from 'hooks/useConfig';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  SupportedToken,
  prodConfigs,
  devConfigs,
  isSupportedToken,
} from 'lib/config';
import { ApplicationProviders } from 'components/ApplicationProviders';
import { Header } from 'components/Header';
import { ErrorBanners } from 'components/ErrorBanners';

const networks = (
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? prodConfigs.map(({ tokenName }) => tokenName)
    : [...prodConfigs, ...devConfigs].map(({ tokenName }) => tokenName)
) as SupportedToken[];

const TOKEN_FROM_PATH_REGEXP = /\/tokens\/([^\/]+)/;
function tokenFromPath(path: string): SupportedToken {
  const match = path.match(TOKEN_FROM_PATH_REGEXP);
  if (match && isSupportedToken(match[1])) {
    return match[1];
  }
  // For the time being, the "default network" (e.g. on the home page)
  // is paprHero. We will change to paprMeme when that launches.
  return 'paprHero';
}

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
