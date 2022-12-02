import { ethers } from 'ethers';
import { ERC20__factory, ERC721__factory } from 'types/generated/abis';
import { PHUSDC__factory } from 'types/generated/abis/factories/PHUSDC__factory';
import { User } from 'types/generated/graphql/inKindSubgraph';
import { configs } from './config';
import { ONE } from './constants';
import { makeProvider } from './contracts';
import { getQuoteForSwap } from './controllers';
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
  paprPrice: ethers.BigNumber,
  oracleInfo: { [key: string]: ReservoirResponseData },
  underlying: string,
): Promise<HeroPlayerBalance> {
  const provider = makeProvider(configs.paprHero.jsonRpcProvider, 'paprHero');
  const connectedPhUSDC = PHUSDC__factory.connect(underlying, provider);
  const phUSDCBalance = ethers.BigNumber.from(user.phUSDCHoldings); //await connectedPhUSDC.balanceOf(user.id);
  const paprBalance = ethers.BigNumber.from(user.paprHoldings);
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

  let totalBalance = phUSDCBalance.add(totalNFTWorth);
  if (netPapr.isNegative()) {
    totalBalance = totalBalance.sub(netPaprInUnderlying);
  } else {
    totalBalance = totalBalance.add(netPaprInUnderlying);
  }

  return {
    totalNFTWorth: parseFloat(ethers.utils.formatUnits(totalNFTWorth, 6)),
    totalPhUSDCBalance: parseFloat(ethers.utils.formatUnits(phUSDCBalance, 6)),
    netPapr: parseFloat(ethers.utils.formatUnits(netPaprInUnderlying, 6)),
    totalBalance: parseFloat(ethers.utils.formatUnits(totalBalance, 6)),
  };
}
