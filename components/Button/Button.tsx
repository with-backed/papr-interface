import React, { ButtonHTMLAttributes, ComponentProps, useMemo } from 'react';
import { DialogDisclosure } from 'reakit/Dialog';
import { Disclosure } from 'reakit/Disclosure';
import styles from './Button.module.css';

export type ButtonKind = 'regular' | 'outline';
export type ButtonTheme = 'papr' | 'hero' | 'meme';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  theme?: ButtonTheme;
}

export function Button({
  children,
  kind = 'regular',
  theme = 'papr',
  ...props
}: ButtonProps) {
  const className = useMemo(
    () => [styles[kind], styles[theme]].join(' '),
    [kind, theme],
  );
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}

interface DialogDisclosureButtonProps
  extends ComponentProps<typeof DialogDisclosure> {
  kind?: ButtonKind;
}

export function DialogDisclosureButton({
  children,
  kind = 'regular',
  ...props
}: DialogDisclosureButtonProps) {
  return (
    <DialogDisclosure {...props} className={styles[kind]}>
      {children}
    </DialogDisclosure>
  );
}

interface DisclosureButtonProps extends ComponentProps<typeof Disclosure> {}

export function DisclosureButton({
  children,
  visible,
  ...rest
}: DisclosureButtonProps) {
  return (
    <Disclosure
      as={'button'}
      role={'disclosure'}
      className={styles['regular']}
      visible={visible}
      {...rest}>
      {children}
    </Disclosure>
  );
}
