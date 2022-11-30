import { ButtonTheme } from 'components/Button/Button';
import { useConfig } from 'hooks/useConfig';
import { SupportedToken } from 'lib/config';
import { useRouter } from 'next/router';

const buttonLookup: { [key in SupportedToken]: ButtonTheme } = {
  paprMeme: 'meme',
  paprTrash: 'trash',
  paprHero: 'hero',
};

export function useTheme(): ButtonTheme {
  const { tokenName } = useConfig();
  const { asPath } = useRouter();

  if (asPath === '/') {
    return 'papr';
  }

  return buttonLookup[tokenName as SupportedToken];
}
