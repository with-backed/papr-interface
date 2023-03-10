import { render } from '@testing-library/react';
import { ContractStatus } from 'components/ContractStatus';
import { ethers } from 'ethers';
import { useControllerPricesData } from 'hooks/useControllerPricesData';
import { useLatestMarketPrice } from 'hooks/useLatestMarketPrice';
import { useTarget } from 'hooks/useTarget/useTarget';
import { subgraphController } from 'lib/mockData/mockPaprController';
import { UTCTimestamp } from 'lightweight-charts';

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

jest.mock('hooks/useTarget/useTarget', () => ({
  useTarget: jest.fn(),
}));

jest.mock('hooks/useLatestMarketPrice', () => ({
  useLatestMarketPrice: jest.fn(),
}));

jest.mock('hooks/useControllerPricesData', () => ({
  useControllerPricesData: jest.fn(),
}));

jest.mock('hooks/useTheme', () => ({
  ...jest.requireActual('hooks/useTheme'),
  useTheme: () => 'trash',
}));

const mockedUseTarget = useTarget as jest.MockedFunction<typeof useTarget>;

const mockedUseControllerPricesData =
  useControllerPricesData as jest.MockedFunction<
    typeof useControllerPricesData
  >;

const mockedUseLatestMarketPrice = useLatestMarketPrice as jest.MockedFunction<
  typeof useLatestMarketPrice
>;

describe('ContractStatus', () => {
  it('renders a loading message while the hook is fetching', () => {
    mockedUseControllerPricesData.mockReturnValue({
      pricesData: null,
      fetching: true,
      error: null,
    });
    mockedUseTarget.mockReturnValue(undefined);
    mockedUseLatestMarketPrice.mockReturnValue(null);
    const { getByText } = render(<ContractStatus />);
    getByText('Loading price data...');
  });
  it('renders RatesPositive when rates are positive', () => {
    mockedUseControllerPricesData.mockReturnValue({
      pricesData: pricesDataPositive,
      fetching: false,
      error: null,
    });
    mockedUseLatestMarketPrice.mockReturnValue(
      pricesDataPositive.markValues[0].value,
    );
    mockedUseTarget.mockReturnValue({
      newTarget: ethers.utils.parseUnits(
        pricesDataPositive.targetValues[1].value.toString(),
        18,
      ),
      timestamp: pricesDataPositive.targetValues[1].time,
    });
    const { getByTestId } = render(<ContractStatus />);
    getByTestId('rates-positive');
  });
  it('renders RatesNegative when rates are negative', () => {
    mockedUseControllerPricesData.mockReturnValue({
      pricesData: pricesDataNegative,
      fetching: false,
      error: null,
    });
    mockedUseLatestMarketPrice.mockReturnValue(
      pricesDataNegative.markValues[0].value,
    );
    mockedUseTarget.mockReturnValue({
      newTarget: ethers.utils.parseUnits(
        pricesDataNegative.targetValues[1].value.toString(),
        18,
      ),
      timestamp: pricesDataNegative.targetValues[1].time,
    });
    const { getByTestId } = render(<ContractStatus />);
    getByTestId('rates-negative');
  });
});
