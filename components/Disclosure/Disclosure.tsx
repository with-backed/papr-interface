import { Chevron } from 'components/Icons/Chevron';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Disclosure as ReakitDisclosure,
  DisclosureContent,
  useDisclosureState,
} from 'reakit/Disclosure';

import styles from './Disclosure.module.css';

type DisclosureProps = React.PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

export function Disclosure({ children, subtitle, title }: DisclosureProps) {
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const disclosure = useDisclosureState({ visible: false });

  const handleClick = useCallback(() => {
    setHasBeenOpened(true);
    setIsOpen((prev) => !prev);
  }, [setHasBeenOpened]);

  const className = useMemo(() => {
    if (!isOpen) {
      return hasBeenOpened ? styles.opened : styles.disclosure;
    }
    return styles['currently-open'];
  }, [hasBeenOpened, isOpen]);

  return (
    <>
      <ReakitDisclosure
        onClick={handleClick}
        as="div"
        className={className}
        {...disclosure}>
        {title}
        <Chevron />
      </ReakitDisclosure>
      {!isOpen && !!subtitle && (
        <span className={styles.subtitle}>{subtitle}</span>
      )}
      <DisclosureContent className={styles.content} {...disclosure}>
        {children}
      </DisclosureContent>
    </>
  );
}
