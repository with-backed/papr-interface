import React, { FunctionComponent, useState } from 'react';

import { Toggle } from './Toggle';

const Wrapper: FunctionComponent = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      width: 'max-content',
      padding: '2rem',
    }}>
    {children}
  </div>
);

export const Toggles = () => {
  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(false);
  return (
    <Wrapper>
      <Toggle
        checked={check1}
        onChange={() => setCheck1((prev) => !prev)}
        leftText="Borrow More"
        rightText="Repay"
        theme="hero"
      />
      <Toggle
        checked={check2}
        onChange={() => setCheck2((prev) => !prev)}
        leftText="Borrow More"
        rightText="Repay"
        theme="papr"
      />
      <Toggle
        checked={check1}
        onChange={() => setCheck1((prev) => !prev)}
        leftText="Borrow More"
        rightText="Repay"
        theme="trash"
      />
      <Toggle
        checked={check2}
        onChange={() => setCheck2((prev) => !prev)}
        leftText="Borrow More"
        rightText="Repay"
        theme="meme"
      />
    </Wrapper>
  );
};
