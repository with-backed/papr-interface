import { render } from '@testing-library/react';
import { ContractStatus } from 'components/ContractStatus';

const basePricesData = {
  indexDPR: 0,
  index: 1e-18,
  targetDPRValues: [],
  targetValues: [],
  markValues: [],
  markDPRValues: [],
  indexDPRValues: [],
};

const pricesDataPositive = {
  ...basePricesData,
  targetValues: [
    { value: 1.052329, time: 1674461832 },
    { value: 1.062329, time: 1674461832 },
  ],
  markValues: [{ value: 1.3915, time: 1674618228 }],
};

const pricesDataNegative = {
  ...basePricesData,
  targetValues: [
    { value: 1.062329, time: 1674461832 },
    { value: 1.052329, time: 1674461832 },
  ],
  markValues: [{ value: 1.052329, time: 1674461832 }],
};

describe('ContractStatus', () => {
  it('renders an error message when there is no price data', () => {
    const { getByText } = render(<ContractStatus pricesData={null} />);
    getByText('Failed to load price data.');
  });
  it('renders RatesPositive when rates are positive', () => {
    const { getByTestId } = render(
      <ContractStatus pricesData={pricesDataPositive as any} />,
    );
    getByTestId('rates-positive');
  });
  it('renders RatesNegative when rates are negative', () => {
    const { getByTestId } = render(
      <ContractStatus pricesData={pricesDataNegative as any} />,
    );
    getByTestId('rates-negative');
  });
});
