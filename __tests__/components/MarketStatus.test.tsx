import { render } from '@testing-library/react';
import { MarketStatus } from 'components/MarketStatus';
import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { CombinedError } from 'urql';

jest.mock('hooks/useControllerPricesData', () => ({
  ...jest.requireActual('hooks/useControllerPricesData'),
  useControllerPricesData: jest.fn(),
}));

const mockedUseControllerPricesData =
  useControllerPricesData as jest.MockedFunction<
    typeof useControllerPricesData
  >;

describe('MarketStatus', () => {
  it('renders a fetching state while fetching', () => {
    mockedUseControllerPricesData.mockReturnValue({
      pricesData: null,
      fetching: true,
      error: null,
    });
    const { getByTestId } = render(<MarketStatus />);

    getByTestId('market-status-fetching');
  });
  it('renders an error state when fetching fails', () => {
    mockedUseControllerPricesData.mockReturnValue({
      pricesData: null,
      fetching: false,
      error: new CombinedError({}),
    });
    const { getByTestId } = render(<MarketStatus />);

    getByTestId('market-status-error');
  });
});
