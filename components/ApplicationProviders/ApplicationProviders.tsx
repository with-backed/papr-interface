import { CenterProvider } from '@center-inc/react';
import {
  DisclaimerComponent,
  getDefaultWallets,
  lightTheme,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { useConfig } from 'hooks/useConfig';
import { GlobalMessagingProvider } from 'hooks/useGlobalMessages';
import { PaprBalanceProvider } from 'hooks/usePaprBalance';
import { TargetProvider } from 'hooks/useTarget';
import { TimestampProvider } from 'hooks/useTimestamp';
import { FunctionComponent, useMemo } from 'react';
import {
  createClient as createUrqlClient,
  Provider as UrqlProvider,
} from 'urql';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { goerli, mainnet } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';

// TODO: since paprHero will always be around, do we need this distinction?
const prodChains = [mainnet, goerli];
const CHAINS =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? prodChains
    : [...prodChains, goerli];

const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
  <Text>
    By connecting your wallet, you agree to the{' '}
    <Link href="/legal/terms-of-service.pdf">Backed Terms of Service</Link> and
    acknowledge you have read and understand the{' '}
    <Link href="https://github.com/with-backed/backed-protocol/blob/master/README.md#disclaimer">
      Backed protocol disclaimer
    </Link>
    .
  </Text>
);

export const ApplicationProviders: FunctionComponent = ({ children }) => {
  const { infuraId, alchemyId, network, centerNetwork, paprSubgraph } =
    useConfig();
  const orderedChains = useMemo(() => {
    const thisChain = CHAINS.find((c) => c.name.toLowerCase() === network)!;
    return [thisChain, ...CHAINS];
  }, [network]);

  const { provider, chains, webSocketProvider } = useMemo(
    () =>
      configureChains(orderedChains, [
        alchemyProvider({ apiKey: alchemyId }),
        infuraProvider({ apiKey: infuraId }),
        publicProvider(),
      ]),
    [alchemyId, infuraId, orderedChains],
  );

  const { connectors } = useMemo(
    () =>
      getDefaultWallets({
        appName: 'papr.wtf',
        projectId: 'f3e09fb8e85b3482ad92cc096fcc4a88',
        chains,
      }),
    [chains],
  );

  const client = useMemo(() => {
    return createClient({
      autoConnect: true,
      connectors,
      provider,
      webSocketProvider,
    });
  }, [connectors, provider, webSocketProvider]);

  const inKindClient = useMemo(() => {
    return createUrqlClient({
      url: paprSubgraph,
    });
  }, [paprSubgraph]);

  return (
    <GlobalMessagingProvider>
      <WagmiConfig client={client}>
        <RainbowKitProvider
          theme={lightTheme()}
          chains={chains}
          appInfo={{
            appName: 'Backed',
            disclaimer: Disclaimer,
          }}>
          {/* TODO: make this typesafe? */}
          <CenterProvider
            network={centerNetwork as any}
            apiKey={process.env.NEXT_PUBLIC_CENTER_KEY ?? ''}>
            <TimestampProvider>
              <TargetProvider>
                <PaprBalanceProvider>
                  <UrqlProvider value={inKindClient}>{children}</UrqlProvider>
                </PaprBalanceProvider>
              </TargetProvider>
            </TimestampProvider>
          </CenterProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </GlobalMessagingProvider>
  );
};
