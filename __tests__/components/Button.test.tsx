import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'components/Button';

jest.mock('wagmi', () => ({
  ...jest.requireActual('wagmi'),
  useSigner: jest.fn().mockReturnValue([{ data: jest.fn() }]),
}));

describe('Button Components', () => {
  describe('Button', () => {
    it('calls its onClick when clicked', () => {
      const handleClick = jest.fn();
      const { getByText } = render(
        <Button onClick={handleClick}>Hello</Button>,
      );
      const button = getByText('Hello');
      expect(handleClick).not.toHaveBeenCalled();
      userEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });
  });
});
