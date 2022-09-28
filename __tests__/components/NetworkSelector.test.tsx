import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as nextRouter from 'next/router';
import { NetworkSelector } from 'components/NetworkSelector';

jest.spyOn(nextRouter, 'useRouter');
const originalLocation = global.location;

const mockedUseRouter = nextRouter.useRouter as jest.MockedFunction<
  typeof nextRouter.useRouter
>;
mockedUseRouter.mockImplementation(
  () => ({ route: '/networks/goerli/loans/create' } as any),
);

const mockAssign = jest.fn();

describe('Select', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      value: {
        assign: mockAssign,
      },
    });
  });
  afterAll(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders, setting the current value to the current network', () => {
    const { getByText } = render(<NetworkSelector />);

    getByText('Rinkeby');
  });

  describe('network selection', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('does nothing if you select the current network', () => {
      const { getByText, queryAllByText } = render(<NetworkSelector />);

      const input = getByText('Rinkeby');

      userEvent.click(input);

      // There are two instances of "Rinkeby"; one in the value part of the
      // select and one in the list. We want the one in the list.
      const rinkebys = queryAllByText('Rinkeby')!;
      const rinkeby = rinkebys[1];
      userEvent.click(rinkeby);

      expect(mockAssign).not.toHaveBeenCalled();
    });

    it('handles selection on a loan page', () => {
      mockedUseRouter.mockImplementation(
        () => ({ mockAssign, route: '/networks/goerli/loans/1337' } as any),
      );
      const { getByText } = render(<NetworkSelector />);

      const input = getByText('Rinkeby');

      userEvent.click(input);

      const optimism = getByText('Optimism');
      userEvent.click(optimism);

      expect(mockAssign).toHaveBeenCalledWith('/networks/optimism');
      expect(mockAssign).toHaveBeenCalledTimes(1);
    });

    it('handles selection on the home page', () => {
      mockedUseRouter.mockImplementation(
        () => ({ mockAssign, route: '/networks/goerli' } as any),
      );
      const { getByText } = render(<NetworkSelector />);

      const input = getByText('Rinkeby');

      userEvent.click(input);

      const optimism = getByText('Optimism');
      userEvent.click(optimism);

      expect(mockAssign).toHaveBeenCalledWith('/networks/optimism');
      expect(mockAssign).toHaveBeenCalledTimes(1);
    });

    it('handles selection on the create page', () => {
      mockedUseRouter.mockImplementation(
        () => ({ mockAssign, route: '/networks/goerli/loans/create' } as any),
      );
      const { getByText } = render(<NetworkSelector />);

      const input = getByText('Rinkeby');

      userEvent.click(input);

      const optimism = getByText('Optimism');
      userEvent.click(optimism);

      expect(mockAssign).toHaveBeenCalledWith(
        '/networks/optimism/loans/create',
      );
      expect(mockAssign).toHaveBeenCalledTimes(1);
    });

    it('handles selection on the profile page', () => {
      mockedUseRouter.mockImplementation(
        () =>
          ({
            mockAssign,
            route: '/networks/goerli/profile/0xwhatever',
          } as any),
      );
      const { getByText } = render(<NetworkSelector />);

      const input = getByText('Rinkeby');

      userEvent.click(input);

      const optimism = getByText('Optimism');
      userEvent.click(optimism);

      expect(mockAssign).toHaveBeenCalledWith(
        '/networks/optimism/profile/0xwhatever',
      );
      expect(mockAssign).toHaveBeenCalledTimes(1);
    });
  });
});
