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
  SupportedNetwork,
  isSupportedNetwork,
  prodConfigs,
  devConfigs,
} from 'lib/config';
import { ApplicationProviders } from 'components/ApplicationProviders';
import { useNetworkSpecificStyles } from 'hooks/useNetworkSpecificStyles';
import { Header } from 'components/Header';
import { ErrorBanners } from 'components/ErrorBanners';

const networks = (
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? prodConfigs.map(({ network }) => network)
    : [...prodConfigs, ...devConfigs].map(({ network }) => network)
) as SupportedNetwork[];

const NETWORK_FROM_PATH_REGEXP = /\/networks\/([^\/]+)/;
function networkFromPath(path: string) {
  const match = path.match(NETWORK_FROM_PATH_REGEXP);
  if (match) {
    return match[1];
  }
  return networks[0];
}

export default function App({ Component, pageProps }: AppProps) {
  const { asPath } = useRouter();
  const [network, setNetwork] = useState<SupportedNetwork>(
    networkFromPath(asPath) as SupportedNetwork,
  );
  useNetworkSpecificStyles(network);

  useEffect(() => {
    const newPath = networkFromPath(asPath);
    if (newPath !== network) {
      setNetwork(newPath as SupportedNetwork);
    }
  }, [asPath, network]);

  return (
    <ConfigProvider network={network}>
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
