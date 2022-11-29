import { useConfig } from 'hooks/useConfig';
import { SupportedToken } from 'lib/config';
import { useRouter } from 'next/router';

export function useTheme(): SupportedToken {
  const { tokenName } = useConfig();
  const { asPath } = useRouter();

  if (asPath === '/') {
    return 'paprMeme';
  }

  return tokenName as SupportedToken;
}
