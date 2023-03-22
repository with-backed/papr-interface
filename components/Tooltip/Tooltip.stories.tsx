import React, { FunctionComponent } from 'react';
import {
  TooltipReference as ReakitTooltipReference,
  useTooltipState,
} from 'reakit/Tooltip';

import { Tooltip } from './Tooltip';
import { TooltipReference } from './TooltipReference';

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

export const Tooltips = () => {
  const tooltip = useTooltipState();
  return (
    <Wrapper>
      <p>
        Hover{' '}
        <ReakitTooltipReference as="span" {...tooltip}>
          here
        </ReakitTooltipReference>{' '}
        for a tooltip
      </p>
      <Tooltip {...tooltip}>Hi</Tooltip>
    </Wrapper>
  );
};

export const DecoratedTooltips = () => {
  const tooltip = useTooltipState();
  return (
    <Wrapper>
      <p>
        Hover <TooltipReference {...tooltip}>here</TooltipReference> for a
        tooltip
      </p>
      <Tooltip {...tooltip}>Hi</Tooltip>
    </Wrapper>
  );
};
