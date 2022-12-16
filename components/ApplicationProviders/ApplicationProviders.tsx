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
import { TimestampProvider } from 'hooks/useTimestamp/useTimestamp';
import { FunctionComponent, useMemo } from 'react';
import {
  createClient as createUrqlClient,
  Provider as UrqlProvider,
} from 'urql';
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';

const prodChains = [chain.mainnet, chain.goerli];
const CHAINS =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? prodChains
    : [...prodChains, chain.goerli];

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
  const { infuraId, alchemyId, network, centerNetwork, paprMemeSubgraph } =
    useConfig();
  const orderedChains = useMemo(() => {
    const thisChain = CHAINS.find((c) => c.name.toLowerCase() === network)!;
    return [thisChain, ...CHAINS];
  }, [network]);

  const { provider, chains } = useMemo(
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
        appName: 'Backed',
        chains,
      }),
    [chains],
  );

  const client = useMemo(() => {
    return createClient({
      autoConnect: true,
      connectors,
      provider,
    });
  }, [connectors, provider]);

  const inKindClient = useMemo(() => {
    return createUrqlClient({
      url: paprMemeSubgraph,
    });
  }, [paprMemeSubgraph]);

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
            <PaprBalanceProvider>
              <TimestampProvider>
                <UrqlProvider value={inKindClient}>{children}</UrqlProvider>
              </TimestampProvider>
            </PaprBalanceProvider>
          </CenterProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </GlobalMessagingProvider>
  );
};
