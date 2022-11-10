import { useConfig } from 'hooks/useConfig';
import React from 'react';
import backedBunny from '../../public/logos/backed-bunny.png';
import borkedBunny from './borked-bunny.png';
import pepe from './pepe-bunny-line.png';
import { SupportedToken } from 'lib/config';
import styles from './Logo.module.css';

type ImageDirectory = {
  [key in SupportedToken]: StaticImageData;
};
const ERROR_LOGOS: ImageDirectory = {
  paprHero: borkedBunny,
  paprMeme: borkedBunny,
};

const NORMAL_LOGOS: ImageDirectory = {
  paprHero: backedBunny,
  paprMeme: backedBunny,
};

export function getLogo(
  network: SupportedToken,
  error?: boolean,
  codeActive?: boolean,
) {
  if (codeActive) {
    return pepe;
  }

  if (error) {
    return ERROR_LOGOS[network];
  }

  return NORMAL_LOGOS[network];
}

type LogoProps = {
  error?: boolean;
  codeActive?: boolean;
};
export const Logo = ({ error, codeActive }: LogoProps) => {
  const { tokenName } = useConfig();
  return (
    <img
      className={styles.image}
      src={getLogo(tokenName as SupportedToken, error, codeActive).src}
      alt="Backed logo"
    />
  );
};
