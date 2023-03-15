import { renderHook } from '@testing-library/react';
import PaprControllerABI from 'abis/PaprController.json';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useVaultWrite } from 'hooks/useVaultWrite';
import { VaultWriteType } from 'hooks/useVaultWrite/helpers';
import { configs } from 'lib/config';
import { subgraphController } from 'lib/mockData/mockPaprController';
import { useContractWrite } from 'wagmi';

jest.mock('hooks/useController', () => ({
  useController: jest.fn(),
}));
jest.mock('hooks/useOracleInfo/useOracleInfo', () => ({
  useOracleInfo: jest.fn().mockReturnValue({
    '0x36b8f7b7be4680c3511e764e0d2b56d54ad57d6e': {
      price: 1,
      message: {
        id: '0x9ab2e556e50977fa2f487e5642b8fa27431bef302219fe0daed3d6283e10a13a',
        timestamp: 0,
        payload:
          '0x000000000000000000000000f5f4619764b3bcba95aba3b25212365fc61668620000000000000000000000000000000000000000000000000000000039292dc0',
        signature:
          '0xd8982ac2d64393698a83289e57298ccc0b634f5d087368d975a6959cba85de66766af1b39acfcd138f49a9b37f023a603449a4128377efed30e881e6250405ce1c',
      },
      data: '0xdata',
    },
  }),
}));

jest.mock('wagmi', () => ({
  ...jest.requireActual('wagmi'),
  useAccount: jest.fn().mockReturnValue({
    address: '0xE89CB2053A04Daf86ABaa1f4bC6D50744e57d39E',
    connector: undefined,
    isConnected: false,
    isConnecting: true,
    isDisconnected: false,
    isReconnecting: false,
    status: 'connecting',
  }),
  usePrepareContractWrite: jest.fn().mockReturnValue({
    config: {
      abi: PaprControllerABI.abi,
      address: '' as `0x${string}`,
      functionName: 'someFunctionName',
      mode: 'prepared',
      request: undefined,
    },
  }),
  useContractWrite: jest.fn(),
}));
jest.mock('hooks/useConfig', () => ({
  ...jest.requireActual('hooks/useConfig'),
  useConfig: jest.fn(() => configs.paprHero),
}));

const mockedUseController = useController as jest.MockedFunction<
  typeof useController
>;

const mockedUseContractWrite = useContractWrite as jest.MockedFunction<
  typeof useContractWrite
>;

describe('useVaultWrite', () => {
  beforeAll(() => {
    mockedUseController.mockReturnValue(subgraphController);
  });
  const collateralContractAddress =
    subgraphController.allowedCollateral[0].token.id;
  const amount = ethers.utils.parseUnits(
    '1',
    subgraphController.paprToken.decimals,
  );
  const quote = ethers.utils.parseUnits(
    '1',
    subgraphController.underlying.decimals,
  );
  const refresh = () => null;

  let writeType: VaultWriteType;
  let depositNFTs: string[] = [];
  let withdrawNFTs: string[] = [];

  beforeEach(() => {
    depositNFTs = [];
    withdrawNFTs = [];
    jest.clearAllMocks();

    // hooks are always called in same order
    // from useVaultWrite.ts, we can see useMulticallWrite is always called before useSafeTransferFromWrite
    mockedUseContractWrite.mockReturnValueOnce({
      data: '0xmulticalldata',
      write: () => null,
      error: null,
    } as any);

    mockedUseContractWrite.mockReturnValueOnce({
      data: '0xsafetransferfromdata',
      write: () => null,
      error: null,
    } as any);
  });

  describe('Borrow', () => {
    beforeEach(() => {
      writeType = VaultWriteType.Borrow;
    });
    it('should return the safeTransferFrom transaction data when borrowing one NFT', () => {
      depositNFTs = [`${collateralContractAddress}-0`];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            true,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xsafetransferfromdata');
    });

    it('should return the multicall transaction data when borrowing multiple NFTs', () => {
      depositNFTs = [
        `${collateralContractAddress}-0`,
        `${collateralContractAddress}-1`,
      ];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            false,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xmulticalldata');
    });

    it('should return the multicall transaction data when depositing one NFT and withdrawing one NFT', () => {
      depositNFTs = [
        `${collateralContractAddress}-0`,
        `${collateralContractAddress}-1`,
      ];
      withdrawNFTs = [`${collateralContractAddress}-2`];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            false,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xmulticalldata');
    });
  });

  describe('Borrow with swap', () => {
    beforeEach(() => {
      writeType = VaultWriteType.BorrowWithSwap;
    });
    it('should return the safeTransferFrom transaction data when borrowing one NFT', () => {
      depositNFTs = [`${collateralContractAddress}-0`];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            true,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xsafetransferfromdata');
    });
    it('should return the multicall transaction data when borrowing multiple NFTs', () => {
      depositNFTs = [
        `${collateralContractAddress}-0`,
        `${collateralContractAddress}-1`,
      ];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            false,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xmulticalldata');
    });
    it('should return the multicall transaction data when depositing one NFT and withdrawing one NFT', () => {
      depositNFTs = [
        `${collateralContractAddress}-0`,
        `${collateralContractAddress}-1`,
      ];
      withdrawNFTs = [`${collateralContractAddress}-2`];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            false,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xmulticalldata');
    });
  });

  describe('Repay', () => {
    beforeEach(() => {
      writeType = VaultWriteType.Repay;
    });
    it('should return the multicall transaction data when borrowing one NFT', () => {
      depositNFTs = [`${collateralContractAddress}-0`];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            false,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xmulticalldata');
    });

    it('should return the multicall transaction data when borrowing multiple NFTs', () => {
      depositNFTs = [
        `${collateralContractAddress}-0`,
        `${collateralContractAddress}-1`,
      ];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            false,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xmulticalldata');
    });

    it('should return the multicall transaction data when depositing one NFT and withdrawing one NFT', () => {
      depositNFTs = [
        `${collateralContractAddress}-0`,
        `${collateralContractAddress}-1`,
      ];
      withdrawNFTs = [`${collateralContractAddress}-2`];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            false,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xmulticalldata');
    });
  });

  describe('Repay with swap', () => {
    beforeEach(() => {
      writeType = VaultWriteType.RepayWithSwap;
    });
    it('should return the multicall transaction data when borrowing one NFT', () => {
      depositNFTs = [`${collateralContractAddress}-0`];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            false,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xmulticalldata');
    });

    it('should return the multicall transaction data when borrowing multiple NFTs', () => {
      depositNFTs = [
        `${collateralContractAddress}-0`,
        `${collateralContractAddress}-1`,
      ];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            false,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xmulticalldata');
    });

    it('should return the multicall transaction data when depositing one NFT and withdrawing one NFT', () => {
      depositNFTs = [
        `${collateralContractAddress}-0`,
        `${collateralContractAddress}-1`,
      ];
      withdrawNFTs = [`${collateralContractAddress}-2`];
      const { result } = renderHook(
        () =>
          useVaultWrite(
            writeType,
            collateralContractAddress,
            depositNFTs,
            withdrawNFTs,
            amount,
            quote,
            false,
            false,
            refresh,
          ),
        {},
      );
      expect(result.current.data).toBe('0xmulticalldata');
    });
  });
});
