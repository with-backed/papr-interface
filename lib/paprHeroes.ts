import { Pool } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import { ERC20__factory, ERC721__factory } from 'types/generated/abis';
import { PHUSDC__factory } from 'types/generated/abis/factories/PHUSDC__factory';
import {
  PaprControllerByIdQuery,
  User,
} from 'types/generated/graphql/inKindSubgraph';
import { PoolByIdQuery } from 'types/generated/graphql/uniswapSubgraph';
import { configs } from './config';
import { ONE } from './constants';
import { makeProvider } from './contracts';
import {
  getLiquidityAndFeesForPosition,
  getQuoteForSwap,
  getUniswapLPTokenIds,
  LiquidityAndFees,
  ZERO_LP_POSITION,
} from './controllers';
import { formatBigNum } from './numberFormat';
import { ReservoirResponseData } from './oracle/reservoir';
import { getAllVaultsForControllerForUser } from './pAPRSubgraph';

export type HeroPlayerBalance = {
  totalNFTWorth: number;
  totalPhUSDCBalance: number;
  netPapr: number;
  totalBalance: number;
};

export async function calculateNetPhUSDCBalance(
  user: User,
  subgraphController: NonNullable<PaprControllerByIdQuery['paprController']>,
  uniswapPool: Pool,
  paprPrice: ethers.BigNumber,
  oracleInfo: { [key: string]: ReservoirResponseData },
): Promise<HeroPlayerBalance> {
  const uniswapLPTokenIds = await getUniswapLPTokenIds(user.id, 'paprHero');
  console.log(`successfully obtained uniswapLPTokenIds for ${user.id}`);
  const allPositionsInfo = await Promise.all(
    uniswapLPTokenIds.map((id) =>
      getLiquidityAndFeesForPosition(
        user.id,
        id,
        subgraphController,
        uniswapPool,
        'paprHero',
      ),
    ),
  );
  console.log(`successfully obtained allPositionsInfo for ${user.id}`);

  const totalLiquidityAndFees = allPositionsInfo.reduce(
    (accumulator, current) => ({
      underlyingAmount: accumulator.underlyingAmount.add(
        current.underlyingAmount,
      ),
      debtTokenAmount: accumulator.debtTokenAmount.add(current.debtTokenAmount),
      feesDebtToken: accumulator.feesDebtToken.add(current.feesDebtToken),
      feesUnderlying: accumulator.feesUnderlying.add(current.feesUnderlying),
    }),
    ZERO_LP_POSITION,
  );

  const provider = makeProvider(configs.paprHero.jsonRpcProvider, 'paprHero');
  const phUSDCBalance = ethers.BigNumber.from(user.phUSDCHoldings)
    .add(totalLiquidityAndFees.underlyingAmount)
    .add(totalLiquidityAndFees.feesUnderlying); //await connectedPhUSDC.balanceOf(user.id);
  const paprBalance = ethers.BigNumber.from(user.paprHoldings)
    .add(totalLiquidityAndFees.debtTokenAmount)
    .add(totalLiquidityAndFees.feesDebtToken);
  const paprDebt = ethers.BigNumber.from(user.paprDebt);
  const netPapr = paprBalance.sub(paprDebt);
  const netPaprInUnderlying = netPapr.mul(paprPrice).div(ONE);
  const addressToCount = (address: string, user: User) => {
    switch (address.toLowerCase()) {
      case '0xabe17952e7fe468711826c26b04b047c0da53b86':
        return user.dinoCount;
      case '0x0593cd2238d1b143bd1c67cd7fa98eee32a260ea':
        return user.moonbirdCount;
      case '0xd4e652bbfcf616c966e1b1e8ed37599d81f11889':
        return user.toadCount;
      case '0x4770646fe8635fa9ed3cb72ed4b7ef6386a06827':
        return user.blitCount;
      default:
        return 0;
    }
  };
  const totalNFTWorth = Object.keys(oracleInfo).reduce(
    (accumulator, current) => {
      var value =
        oracleInfo[current].price * parseInt(addressToCount(current, user));
      value = Math.floor(value * 1e6) / 1e6;
      return accumulator.add(ethers.utils.parseUnits(value.toString(), 6));
    },
    ethers.BigNumber.from(0),
  );

  const totalBalance = phUSDCBalance
    .add(totalNFTWorth)
    .add(netPaprInUnderlying);

  return {
    totalNFTWorth: parseFloat(ethers.utils.formatUnits(totalNFTWorth, 6)),
    totalPhUSDCBalance: parseFloat(ethers.utils.formatUnits(phUSDCBalance, 6)),
    netPapr: parseFloat(ethers.utils.formatUnits(netPaprInUnderlying, 6)),
    totalBalance: parseFloat(ethers.utils.formatUnits(totalBalance, 6)),
  };
}
