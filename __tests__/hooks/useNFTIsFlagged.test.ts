import { renderHook } from '@testing-library/react-hooks';
import { useNFTFlagged } from 'hooks/useNFTFlagged/useNFTFlagged';
import { getNFTIsFlagged } from 'lib/oracle/reservoir';

jest.mock('lib/oracle/reservoir', () => ({
  getNFTIsFlagged: jest.fn(),
}));

const mockedGetNFTIsFlagged = getNFTIsFlagged as jest.MockedFunction<
  typeof getNFTIsFlagged
>;

describe('useNFTIsFlagged', () => {
  const contractAddress = '0x123';
  const tokenId = '1';

  it('should return true if the NFT is flagged', async () => {
    mockedGetNFTIsFlagged.mockResolvedValue(true);
    const { result, waitForNextUpdate } = renderHook(() =>
      useNFTFlagged(contractAddress, tokenId),
    );
    expect(result.current).toBe(false);
    await waitForNextUpdate();
    expect(result.current).toBe(true);
  });

  it('should return false if the NFT is not flagged', async () => {
    mockedGetNFTIsFlagged.mockResolvedValue(false);
    const { result, waitForNextUpdate } = renderHook(() =>
      useNFTFlagged(contractAddress, tokenId),
    );
    expect(result.current).toBe(false);
  });
});
