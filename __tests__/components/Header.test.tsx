import { render } from '@testing-library/react';
import { Header } from 'components/Header';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  ...jest.requireActual('next/router'),
  useRouter: jest.fn(),
}));

jest.mock('components/ConnectWallet');

const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
mockedUseRouter.mockReturnValue({
  asPath: '/tokens/[token]',
  pathname: '/tokens/[token]',
} as any);

describe('Header', () => {
  it('renders', () => {
    const { getByTestId } = render(<Header />);

    getByTestId('header');
  });
});
