import React, { FunctionComponent } from 'react';
import { Button, ButtonKind, ButtonTheme } from './Button';
import { ButtonLink } from './ButtonLink';
import { TextButton, ButtonKind as TextButtonKind } from './TextButton';
import { TransactionButton } from './TransactionButton';

const Wrapper: FunctionComponent = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      width: 'max-content',
      backgroundColor: 'var(--neutral-5)',
      padding: '2rem',
    }}>
    {children}
  </div>
);

const buttonKinds: ButtonKind[] = ['regular', 'outline'];
const buttonThemes: ButtonTheme[] = ['papr', 'meme', 'hero', 'white'];
export const BigButtons = () => (
  <Wrapper>
    {buttonKinds.flatMap((kind) =>
      buttonThemes.map((theme) => (
        <Button size="big" kind={kind} theme={theme} key={kind + theme}>
          Hello
        </Button>
      )),
    )}
  </Wrapper>
);

export const SmallButtons = () => (
  <Wrapper>
    {buttonKinds.flatMap((kind) =>
      buttonThemes.map((theme) => (
        <Button size={'small'} kind={kind} theme={theme} key={kind + theme}>
          Hello
        </Button>
      )),
    )}
  </Wrapper>
);

export const DisabledButtons = () => (
  <Wrapper>
    {buttonKinds.flatMap((kind) =>
      buttonThemes.map((theme) => (
        <Button
          size="big"
          kind={kind}
          theme={theme}
          key={kind + theme}
          disabled>
          Hello
        </Button>
      )),
    )}
  </Wrapper>
);

export const ButtonLinks = () => (
  <Wrapper>
    {buttonKinds.flatMap((kind) =>
      buttonThemes.map((theme) => (
        <ButtonLink href="" kind={kind} theme={theme} key={kind + theme}>
          Hello
        </ButtonLink>
      )),
    )}
  </Wrapper>
);

const textButtonKinds: TextButtonKind[] = [
  'neutral',
  'clickable',
  'visited',
  'active',
  'alert',
  'success',
];
export const TextButtons = () => (
  <Wrapper>
    {textButtonKinds.map((kind) => (
      <TextButton key={kind} kind={kind}>
        Hello
      </TextButton>
    ))}
  </Wrapper>
);

export const TransactionButtons = () => (
  <Wrapper>
    <TransactionButton text="Hello" />
    <TransactionButton text="Hello" completed />
    <TransactionButton text="Hello" disabled />
  </Wrapper>
);
