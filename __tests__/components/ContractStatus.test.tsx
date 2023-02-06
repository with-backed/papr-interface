import { render } from '@testing-library/react';
import { ContractStatus } from 'components/ContractStatus';
import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { UTCTimestamp } from 'lightweight-charts';
import { CombinedError } from 'urql';

const basePricesData = {
  index: 1e-18,
  targetValues: [],
  markValues: [],
};

const pricesDataPositive = {
  ...basePricesData,
  targetValues: [
    { value: 1.052329, time: 1674461832 as UTCTimestamp },
    { value: 1.062329, time: 1674461832 as UTCTimestamp },
  ],
  markValues: [{ value: 1.3915, time: 1674618228 as UTCTimestamp }],
};

const pricesDataNegative = {
  ...basePricesData,
  targetValues: [
    { value: 1.062329, time: 1674461832 as UTCTimestamp },
    { value: 1.052329, time: 1674461832 as UTCTimestamp },
  ],
  markValues: [{ value: 1.052329, time: 1674461832 as UTCTimestamp }],
};

jest.mock('hooks/useControllerPricesData', () => ({
  ...jest.requireActual('hooks/useControllerPricesData'),
  useControllerPricesData: jest.fn(),
}));

jest.mock('hooks/useTheme', () => ({
  ...jest.requireActual('hooks/useTheme'),
  useTheme: () => 'trash',
}));

const mockedUseControllerPricesData =
  useControllerPricesData as jest.MockedFunction<
    typeof useControllerPricesData
  >;

describe('ContractStatus', () => {
  it('renders an error message when there is no price data', () => {
    mockedUseControllerPricesData.mockReturnValue({
      fetching: false,
      pricesData: null,
      error: new CombinedError({}),
    });
    const { getByText } = render(<ContractStatus />);
    getByText('Failed to load price data.');
  });
  it('renders a loading message while the hook is fetching', () => {
    mockedUseControllerPricesData.mockReturnValue({
      fetching: true,
      pricesData: null,
      error: null,
    });
    const { getByText } = render(<ContractStatus />);
    getByText('Loading price data...');
  });
  it('renders RatesPositive when rates are positive', () => {
    mockedUseControllerPricesData.mockReturnValue({
      fetching: false,
      pricesData: pricesDataPositive,
      error: null,
    });
    const { getByTestId } = render(<ContractStatus />);
    getByTestId('rates-positive');
  });
  it('renders RatesNegative when rates are negative', () => {
    mockedUseControllerPricesData.mockReturnValue({
      fetching: false,
      pricesData: pricesDataNegative,
      error: null,
    });
    const { getByTestId } = render(<ContractStatus />);
    getByTestId('rates-negative');
  });
});
