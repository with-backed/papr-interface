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
    }}>
    {children}
  </div>
);

const buttonKinds: ButtonKind[] = ['regular', 'outline'];
const buttonThemes: ButtonTheme[] = ['papr', 'meme', 'hero'];
export const Buttons = () => (
  <Wrapper>
    {buttonKinds.flatMap((kind) =>
      buttonThemes.map((theme) => (
        <Button kind={kind} theme={theme} key={kind + theme}>
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
