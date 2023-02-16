import { renderHook } from '@testing-library/react-hooks';
import { useTheme } from 'hooks/useTheme';
import { configs } from 'lib/config';
import { useRouter } from 'next/router';

jest.mock('hooks/useConfig', () => ({
  ...jest.requireActual('hooks/useConfig'),
  useConfig: () => configs.paprHero,
}));

jest.mock('next/router', () => ({
  ...jest.requireActual('next/router'),
  useRouter: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('useTheme', () => {
  it('returns the token name in the current config', () => {
    mockedUseRouter.mockReturnValue({
      asPath: '/tokens/paprHero/whatever',
    } as any);
    const { result } = renderHook(() => useTheme());

    expect(result.current).toEqual('hero');
  });

  it('returns the default (papr) on the homepage', () => {
    mockedUseRouter.mockReturnValue({
      asPath: '/',
    } as any);
    const { result } = renderHook(() => useTheme());

    expect(result.current).toEqual('papr');
  });
});
