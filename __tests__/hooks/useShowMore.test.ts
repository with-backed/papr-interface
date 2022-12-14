import { renderHook } from '@testing-library/react-hooks';
import { useShowMore } from 'hooks/useShowMore';

const data = [1, 2, 3, 4, 5];

describe('useShowMore', () => {
  it('returns the first increment in the feed', () => {
    const { result } = renderHook(() => useShowMore(data, 2));

    expect(result.current).toEqual(
      expect.objectContaining({ feed: [1, 2], amountThatWillShowNext: 2 }),
    );
  });

  it('paginates as expected', () => {
    const { result } = renderHook(() => useShowMore(data, 2));

    expect(result.current).toEqual(
      expect.objectContaining({ feed: [1, 2], amountThatWillShowNext: 2 }),
    );

    // feed increases, amount to show decreases
    result.current.showMore();
    expect(result.current).toEqual(
      expect.objectContaining({
        feed: [1, 2, 3, 4],
        amountThatWillShowNext: 1,
      }),
    );

    // feed is now full, no more to show
    result.current.showMore();
    expect(result.current).toEqual(
      expect.objectContaining({
        feed: [1, 2, 3, 4, 5],
        amountThatWillShowNext: 0,
      }),
    );

    // hitting it again produces no change
    result.current.showMore();
    expect(result.current).toEqual(
      expect.objectContaining({
        feed: [1, 2, 3, 4, 5],
        amountThatWillShowNext: 0,
      }),
    );
  });
});
