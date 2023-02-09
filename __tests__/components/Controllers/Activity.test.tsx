import React from 'react';
import { render } from '@testing-library/react';
import { Activity } from 'components/Controllers/Activity';
import {
  subgraphController,
  mockUniswapPool,
} from 'lib/mockData/mockPaprController';
import { useUniswapSwapsByPool } from 'hooks/useUniswapSwapsByPool';
import { useActivity } from 'hooks/useActivity';
import { ActivityByControllerQuery } from 'types/generated/graphql/inKindSubgraph';
import userEvent from '@testing-library/user-event';
import { useController } from 'hooks/useController';

jest.mock('hooks/useController', () => ({
  useController: jest.fn(),
}));
jest.mock('hooks/useUniswapSwapsByPool', () => ({
  useUniswapSwapsByPool: jest.fn(),
}));
jest.mock('hooks/useActivity', () => ({
  useActivity: jest.fn(),
}));
jest.mock('hooks/useTheme', () => ({
  useTheme: jest.fn(() => 'papr'),
}));

const mockedUseController = useController as jest.MockedFunction<
  typeof useController
>;
const mockedUseUniswapSwapsByPool =
  useUniswapSwapsByPool as jest.MockedFunction<typeof useUniswapSwapsByPool>;
const mockedUseActivity = useActivity as jest.MockedFunction<
  typeof useActivity
>;

const addCollateralEvent = {
  id: '0xdf5bc3c8b2c7769fadc88b573318b46c156cc00b9b119544503903b60bd8fb9c',
  timestamp: 1665517104,
  vault: {
    id: '0xd2ccc7970501f2802783acd750ee350fcf758349-0x6b2770a75a928989c1d7356366d4665a6487e1b4-0x6ef2c9cb23f03014d18d7e4ceeaec497db00247c',
    token: {
      id: '0xb7d7fe7995d1e347916faae8e16cfd6dd21a9bae',
      contractAddress: '0xb7d7fe7995d1e347916faae8e16cfd6dd21a9bae',
      symbol: 'fAPE',
      name: 'fake APE',
    },
    __typename: 'Vault',
  },
  collateral: {
    id: '0xb7d7fe7995d1e347916faae8e16cfd6dd21a9bae-28',
    tokenId: '28',
    __typename: 'VaultCollateral',
  },
  txHash: '0xdf5bc3c8b2c7769fadc88b573318b46c156cc00b9b119544503903b60bd8fb9c',
  __typename: 'AddCollateralEvent',
};

describe('Activity', () => {
  beforeAll(() => {
    mockedUseController.mockReturnValue(subgraphController);
  });
  it('renders a loading state when swaps are loading', () => {
    mockedUseUniswapSwapsByPool.mockReturnValue({
      fetching: true,
      data: undefined,
    });
    mockedUseActivity.mockReturnValue({
      fetching: false,
      data: undefined,
    });
    const { getByText } = render(<Activity subgraphPool={mockUniswapPool} />);
    getByText('Loading...');
  });

  it('renders a loading state when activity is loading', () => {
    mockedUseUniswapSwapsByPool.mockReturnValue({
      fetching: false,
      data: undefined,
    });
    mockedUseActivity.mockReturnValue({
      fetching: true,
      data: undefined,
    });
    const { getByText } = render(<Activity subgraphPool={mockUniswapPool} />);
    getByText('Loading...');
  });

  it('handles when there are no events', () => {
    mockedUseUniswapSwapsByPool.mockReturnValue({
      fetching: false,
      data: undefined,
    });
    mockedUseActivity.mockReturnValue({
      fetching: false,
      data: undefined,
    });
    const { getByText } = render(<Activity subgraphPool={mockUniswapPool} />);
    getByText('No activity yet');
  });

  it('renders a single event, with no load more button', () => {
    mockedUseUniswapSwapsByPool.mockReturnValue({
      fetching: false,
      data: undefined,
    });
    mockedUseActivity.mockReturnValue({
      fetching: false,
      data: {
        addCollateralEvents: [
          addCollateralEvent,
        ] as ActivityByControllerQuery['addCollateralEvents'],
        removeCollateralEvents: [],
        debtDecreasedEvents: [],
        debtIncreasedEvents: [],
        auctionEndEvents: [],
        auctionStartEvents: [],
      },
    });
    const { container } = render(<Activity subgraphPool={mockUniswapPool} />);
    expect(container.querySelectorAll('tr')).toHaveLength(1);
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders multiple events, with a load more button', () => {
    mockedUseUniswapSwapsByPool.mockReturnValue({
      fetching: false,
      data: undefined,
    });
    mockedUseActivity.mockReturnValue({
      fetching: false,
      data: {
        addCollateralEvents: new Array(6).fill(
          addCollateralEvent,
        ) as ActivityByControllerQuery['addCollateralEvents'],
        removeCollateralEvents: [],
        debtDecreasedEvents: [],
        debtIncreasedEvents: [],
        auctionEndEvents: [],
        auctionStartEvents: [],
      },
    });
    const { container, getByText } = render(
      <Activity subgraphPool={mockUniswapPool} />,
    );
    expect(container.querySelectorAll('tr')).toHaveLength(5);

    const button = getByText('Load 1 more (of 1)');
    userEvent.click(button);

    // Table has expanded with the remaining event
    expect(container.querySelectorAll('tr')).toHaveLength(6);
    // No events left to render, button disappears
    expect(container.querySelector('button')).toBeNull();
  });
});
