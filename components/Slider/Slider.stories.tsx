import { ButtonTheme } from 'components/Button/Button';
import React, { FunctionComponent } from 'react';
import { Slider } from './Slider';

const Wrapper: FunctionComponent = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      width: '600px',
      backgroundColor: 'var(--neutral-5)',
      padding: '2rem',
    }}>
    {children}
  </div>
);

const buttonThemes: ButtonTheme[] = ['papr', 'meme', 'hero', 'trash'];
export const Sliders = () => (
  <Wrapper>
    {buttonThemes.map((theme) => (
      <Slider
        key={theme}
        min={0}
        max={100}
        renderThumb={(props) => <div {...props}></div>}
        renderTrack={(props) => <div {...props}></div>}
        blackTrackWidth={'50px'}
        hideBlackTrack
        value={50}
        theme={theme}
      />
    ))}
  </Wrapper>
);
