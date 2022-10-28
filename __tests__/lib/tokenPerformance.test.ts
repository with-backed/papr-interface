import { findClosestIndex } from 'lib/tokenPerformance';

describe('token performance utilities', () => {
  describe('findClosest', () => {
    it('handles a value lower than lowest current value', () => {
      const haystack = [2, 3, 4];
      const needle = 1;
      expect(findClosestIndex(haystack, needle)).toEqual(0);
    });

    it('handles a higher lower than highest current value', () => {
      const haystack = [2, 3, 4];
      const needle = 5;
      expect(findClosestIndex(haystack, needle)).toEqual(2);
    });

    it.each([
      [[1, 3, 5], 2, 1],
      [[1, 10, 11], 9, 1],
      [[1, 10, 11], 2, 0],
      [[1, 10, 11], 11, 1],
    ])(
      'given %p as the haystack and %p as the needle, returns index %p',
      (haystack, needle, expectedResult) => {
        expect(findClosestIndex(haystack, needle)).toEqual(expectedResult);
      },
    );
  });
});
