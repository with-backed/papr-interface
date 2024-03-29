import { render } from '@testing-library/react';
import { LPPageContent } from 'components/Controllers/LPPageContent';
import { configs } from 'lib/config';

jest.mock('hooks/useConfig', () => ({
  ...jest.requireActual('hooks/useConfig'),
  useConfig: jest.fn(() => configs.paprHero),
}));

jest.mock('hooks/useController', () => ({
  ...jest.requireActual('hooks/useController'),
  useController: jest.fn(() => ({ poolAddress: '0xnotarealaddress' })),
}));

jest.mock('hooks/usePoolStats', () => ({
  ...jest.requireActual('hooks/usePoolStats'),
  usePoolStats: () => ({
    fees24h: '$313.37',
    totalValueLocked: '$1010101.01',
    volume24h: '$0.16',
    feeTier: '1%',
  }),
}));

// Mocking to avoid difficulties with canvas in Jest
jest.mock('components/Controllers/LPPageContent/Chart', () => ({
  ...jest.requireActual('components/Controllers/LPPageContent/Chart'),
  Chart: () => <div />,
}));

jest.mock('hooks/useTheme', () => ({
  ...jest.requireActual('hooks/useTheme'),
  useTheme: () => 'paprHero',
}));

describe('LPPageContent', () => {
  it('renders', () => {
    const { getByText } = render(<LPPageContent />);

    getByText('$1010101.01');
  });
});
