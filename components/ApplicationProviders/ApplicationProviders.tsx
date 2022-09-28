import {
  getDefaultWallets,
  lightTheme,
  RainbowKitProvider,
  DisclaimerComponent,
} from '@rainbow-me/rainbowkit';
import { CommunityGradientProvider } from 'hooks/useCommunityGradient';
import { useConfig } from 'hooks/useConfig';
import { GlobalMessagingProvider } from 'hooks/useGlobalMessages';
import { TimestampProvider } from 'hooks/useTimestamp/useTimestamp';
import React, { PropsWithChildren, useMemo } from 'react';
import { WagmiConfig, chain, createClient, configureChains } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';
import {
  createClient as createUrqlClient,
  Provider as UrqlProvider,
} from 'urql';
import { CenterProvider } from 'nft-react';

const prodChains = [chain.mainnet, chain.polygon, chain.optimism];
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

type ApplicationProvidersProps = {};
export const ApplicationProviders = ({
  children,
}: PropsWithChildren<ApplicationProvidersProps>) => {
  const { infuraId, alchemyId, network, centerNetwork } = useConfig();
  const orderedChains = useMemo(() => {
    const thisChain = CHAINS.find((c) => c.name.toLowerCase() === network)!;
    return [thisChain, ...CHAINS];
  }, [network]);

  const { provider, chains } = useMemo(
    () =>
      configureChains(orderedChains, [
        alchemyProvider({ alchemyId }),
        infuraProvider({ infuraId }),
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

  // TODO: may want to compartmentalize this just to v2 pages; can make a higher-order component to wrap those routes
  const inKindClient = useMemo(() => {
    return createUrqlClient({
      url: 'https://api.thegraph.com/subgraphs/name/adamgobes/sly-fox',
    });
  }, []);

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
            apiKey={process.env.NEXT_PUBLIC_CENTER_KEY!}>
            <TimestampProvider>
              <CommunityGradientProvider>
                <UrqlProvider value={inKindClient}>{children}</UrqlProvider>
              </CommunityGradientProvider>
            </TimestampProvider>
          </CenterProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </GlobalMessagingProvider>
  );
};
