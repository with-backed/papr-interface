import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Activity } from 'components/Controllers/Activity';
import { useActivity } from 'hooks/useActivity';
import { ActivityType } from 'hooks/useActivity/useActivity';
import { useController } from 'hooks/useController';
import { mockActivity } from 'lib/mockData/mockActivity';
import { subgraphController } from 'lib/mockData/mockPaprController';
import React from 'react';

jest.mock('hooks/useController', () => ({
  useController: jest.fn(),
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
const mockedUseActivity = useActivity as jest.MockedFunction<
  typeof useActivity
>;

describe('Activity', () => {
  const fetchMore = jest.fn();

  beforeAll(() => {
    mockedUseController.mockReturnValue(subgraphController);
  });
  it('renders a loading state when activity is loading', () => {
    mockedUseActivity.mockReturnValue({
      fetching: true,
      data: [],
      fetchMore,
      remaining: true,
    });
    const { getByText } = render(<Activity />);
    getByText('Loading...');
  });

  it('handles when there are no events', () => {
    mockedUseActivity.mockReturnValue({
      fetching: false,
      data: [],
      fetchMore,
      remaining: true,
    });
    const { getByText } = render(<Activity />);
    getByText('No activity yet');
  });

  it('renders a single event, without the load more button', () => {
    mockedUseActivity.mockReturnValue({
      fetching: false,
      data: [mockActivity[0]] as ActivityType[],
      fetchMore,
      remaining: false,
    });
    const { container } = render(<Activity />);
    expect(container.querySelectorAll('tr')).toHaveLength(1);
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders events, with a load more button', () => {
    mockedUseActivity.mockReturnValue({
      fetching: false,
      data: mockActivity as ActivityType[],
      fetchMore,
      remaining: true,
    });
    const { container, getByText } = render(<Activity />);
    expect(container.querySelectorAll('tr')).toHaveLength(5);
    expect(container.querySelector('button')).not.toBeNull();

    const button = getByText('Load 5 more');
    userEvent.click(button);

    expect(fetchMore).toHaveBeenCalled();
  });
});
