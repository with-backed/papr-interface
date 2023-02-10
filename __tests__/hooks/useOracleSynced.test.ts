import { renderHook } from '@testing-library/react-hooks';
import { useOracleSynced } from 'hooks/useOracleSynced';
import { getLatestBlockTimestamp } from 'lib/chainHelpers';
import { OraclePriceType } from 'lib/oracle/reservoir';

jest.mock('hooks/useOracleInfo/useOracleInfo', () => ({
  useOracleInfo: jest.fn().mockReturnValue({
    '0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e': {
      price: 1,
      message: {
        id: '0x9ab2e556e50977fa2f487e5642b8fa27431bef302219fe0daed3d6283e10a13a',
        timestamp: 1000,
        payload:
          '0x000000000000000000000000f5f4619764b3bcba95aba3b25212365fc61668620000000000000000000000000000000000000000000000000000000039292dc0',
        signature:
          '0xd8982ac2d64393698a83289e57298ccc0b634f5d087368d975a6959cba85de66766af1b39acfcd138f49a9b37f023a603449a4128377efed30e881e6250405ce1c',
      },
      data: '0xdata',
    },
  }),
}));

jest.mock('lib/chainHelpers', () => ({
  getLatestBlockTimestamp: jest.fn(),
}));

const mockedGetLatestBlockTimestamp =
  getLatestBlockTimestamp as jest.MockedFunction<
    typeof getLatestBlockTimestamp
  >;

describe('useOracleSync', () => {
  it('returns true when oracle message is older than latest block timestamp', async () => {
    mockedGetLatestBlockTimestamp.mockResolvedValue(1001);
    const { result, waitForNextUpdate } = renderHook(() =>
      useOracleSynced(
        '0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e',
        OraclePriceType.lower,
      ),
    );
    expect(result.current).toBe(false);
    await waitForNextUpdate();
    expect(result.current).toBe(true);
  });

  it('returns false when oracle message is newer than latest block timestamp', async () => {
    mockedGetLatestBlockTimestamp.mockResolvedValue(999);
    const { result, waitForNextUpdate } = renderHook(() =>
      useOracleSynced(
        '0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e',
        OraclePriceType.lower,
      ),
    );
    expect(result.current).toBe(false);
    await waitForNextUpdate();
    expect(result.current).toBe(false);
  });
});
