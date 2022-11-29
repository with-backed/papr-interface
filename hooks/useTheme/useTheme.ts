import { ButtonTheme } from 'components/Button/Button';
import { useConfig } from 'hooks/useConfig';
import { SupportedToken } from 'lib/config';
import { useRouter } from 'next/router';

type UseThemeReturn = {
  mainTheme: SupportedToken;
  buttonTheme: ButtonTheme;
};

const buttonLookup: { [key in SupportedToken]: ButtonTheme } = {
  paprMeme: 'meme',
  paprTrash: 'papr',
  paprHero: 'hero',
};

export function useTheme(): UseThemeReturn {
  const { tokenName } = useConfig();
  const { asPath } = useRouter();

  if (asPath === '/') {
    return {
      mainTheme: 'paprMeme',
      buttonTheme: 'meme',
    };
  }

  return {
    mainTheme: tokenName as SupportedToken,
    buttonTheme: buttonLookup[tokenName as SupportedToken],
  };
}
