import { renderHook } from '@testing-library/react-hooks';
import { ethers } from 'ethers';
import { ControllerContextProvider } from 'hooks/useController';
import { useLiveAuctionPrice } from 'hooks/useLiveAuctionPrice';
import { subgraphController } from '__tests__/lib/PaprController.test';
import { getQuoteForSwapOutput } from 'lib/controllers';

const auction = {
  id: '108336989422393537136663695875967233446296675148947056443769352774099790856152',
  vault: {
    id: '0x6df74b0653ba2b622d911ef5680d1776d850ace9-0xe89cb2053a04daf86abaa1f4bc6d50744e57d39e-0x6ef2c9cb23f03014d18d7e4ceeaec497db00247c',
    account: '0xe89cb2053a04daf86abaa1f4bc6d50744e57d39e',
    controller: {
      id: '0x6df74b0653ba2b622d911ef5680d1776d850ace9',
      __typename: 'PaprController' as const,
    },
    __typename: 'Vault' as const,
  },
  auctionAssetID: '12',
  auctionAssetContract: {
    id: '0x6ef2c9cb23f03014d18d7e4ceeaec497db00247c',
    name: 'Cool Cats',
    symbol: 'COOL',
    __typename: 'ERC721Token' as const,
  },
  startedBy: '0xe89cb2053a04daf86abaa1f4bc6d50744e57d39e',
  startPrice: '2673410750056174135037',
  endPrice: null,
  paymentAsset: {
    id: '0x103da64f4366dc82ed0393716376a89dfee4b536',
    name: 'papr trash',
    symbol: 'paprTRASH',
    decimals: 18,
    __typename: 'ERC20Token' as const,
  },
  secondsInPeriod: '86400',
  perPeriodDecayPercentWad: '700000000000000000',
  start: {
    timestamp: 1673977428,
    __typename: 'AuctionStartEvent' as const,
  },
  end: null,
  __typename: 'Auction' as const,
};

const wrapper: React.FunctionComponent = ({ children }) => {
  return (
    <ControllerContextProvider value={subgraphController}>
      {children}
    </ControllerContextProvider>
  );
};

jest.useFakeTimers().setSystemTime(new Date('2023-01-19'));

jest.mock('lib/controllers/index', () => {
  const original = jest.requireActual('lib/controllers/index');
  return {
    ...original,
    getQuoteForSwapOutput: jest.fn(),
  };
});
const mockedGetQuoteForSwapOutput =
  getQuoteForSwapOutput as jest.MockedFunction<typeof getQuoteForSwapOutput>;

describe('useLiveAuctionPrice', () => {
  const startTime = 1674086400;
  const startPrice = ethers.BigNumber.from('585578162375090237174'); // mock quote as 1:1
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetQuoteForSwapOutput.mockResolvedValue(startPrice);
  });
  it('starts at the current auction price and updates at the given interval', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useLiveAuctionPrice(auction),
      {
        wrapper,
      },
    );
    expect(result.current.liveTimestamp).toBe(startTime);
    expect(result.current.liveAuctionPrice.eq(startPrice)).toBe(true);
    expect(result.current.liveAuctionPriceUnderlying).toBe(null); // starting underlying should be null as it fetches quote
    expect(result.current.priceUpdated).toBe(false);

    await waitForNextUpdate();

    expect(result.current.liveAuctionPriceUnderlying?.eq(startPrice)).toBe(
      true,
    );

    jest.advanceTimersToNextTimer();

    expect(result.current.liveTimestamp > startTime).toBe(true);
    expect(result.current.liveAuctionPrice.lt(startPrice)).toBe(true);
    expect(result.current.priceUpdated).toBe(true);
  });
});
