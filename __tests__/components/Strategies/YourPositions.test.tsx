import React from 'react';
import { render } from '@testing-library/react';
import { YourPositions } from 'components/Controllers/YourPositions';
import { mockPaprController } from 'lib/mockData/mockPaprController';
import { useAccount, useContractRead } from 'wagmi';
import { ethers } from 'ethers';
import { useCurrentVault } from 'hooks/useCurrentVault/useCurrentVault';

jest.mock('wagmi', () => ({
  ...jest.requireActual('wagmi'),
  useAccount: jest.fn(),
  useContractRead: jest.fn(),
}));

jest.mock('hooks/useCurrentVault/useCurrentVault', () => ({
  ...jest.requireActual('hooks/useCurrentVault/useCurrentVault'),
  useCurrentVault: jest.fn(),
}));

const mockedUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockedUseContractRead = useContractRead as jest.MockedFunction<
  typeof useContractRead
>;
const mockedUseCurrentVault = useCurrentVault as jest.MockedFunction<
  typeof useCurrentVault
>;

const latestMarketPrice = 1.01;

describe('Activity', () => {
  beforeEach(() => {
    mockedUseContractRead.mockReturnValue({
      isFetching: false,
      data: ethers.BigNumber.from(100) as any,
    } as any);
    mockedUseAccount.mockReturnValue({
      address: '0x0DD7D78Ed27632839cd2a929EE570eAd346C19fC',
    } as any);
    mockedUseCurrentVault.mockReturnValue({
      currentVault: null,
      vaultFetching: false,
    });
  });
  it('renders a connect wallet message when unconnected', () => {
    mockedUseAccount.mockReturnValue({ address: undefined } as any);
    const { getByText } = render(
      <YourPositions
        latestMarketPrice={latestMarketPrice}
        paprController={mockPaprController}
      />,
    );
    getByText('Connect your wallet to see your positions.');
  });
  it('renders a loading message while fetching', () => {
    mockedUseContractRead.mockReturnValue({
      isFetching: true,
      data: null,
    } as any);
    mockedUseCurrentVault.mockReturnValue({
      currentVault: null,
      vaultFetching: true,
    });
    const { getByText } = render(
      <YourPositions
        latestMarketPrice={latestMarketPrice}
        paprController={mockPaprController}
      />,
    );
    getByText('Loading...');
  });
});
