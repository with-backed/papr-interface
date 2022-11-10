import { Config, configs, SupportedToken } from 'lib/config';
import { createContext, FunctionComponent, useContext } from 'react';

const ConfigContext = createContext<Config | null>(null);

type ConfigProviderProps = {
  token: SupportedToken;
};

export const ConfigProvider: FunctionComponent<ConfigProviderProps> = ({
  children,
  token,
}) => {
  return (
    <ConfigContext.Provider value={configs[token]}>
      {children}
    </ConfigContext.Provider>
  );
};

export function useConfig(): Config {
  const config = useContext(ConfigContext);

  return config!;
}
