import { ethers } from 'ethers';
import { ERC20__factory, ERC721__factory } from 'types/generated/abis';
import { PHUSDC__factory } from 'types/generated/abis/factories/PHUSDC__factory';
import { configs } from './config';
import { makeProvider } from './contracts';
import { getQuoteForSwap } from './controllers';
import { ReservoirResponseData } from './oracle/reservoir';
import { getAllVaultsForControllerForUser } from './pAPRSubgraph';

export type HeroPlayerBalance = {
  totalNFTWorth: number;
  totalPhUSDCBalance: number;
  netPapr: number;
  totalBalance: number;
};

export async function calculateNetPhUSDCBalance(
  address: string,
  allowedCollateral: string[],
  oracleInfo: { [key: string]: ReservoirResponseData },
  underlying: string,
  paprToken: string,
): Promise<HeroPlayerBalance> {
  const provider = makeProvider(configs.paprHero.jsonRpcProvider, 'paprHero');
  const connectedERC721 = allowedCollateral.map((c) =>
    ERC721__factory.connect(
      c,
      makeProvider(configs.paprHero.jsonRpcProvider, 'paprHero'),
    ),
  );
  const connectedPhUSDC = PHUSDC__factory.connect(underlying, provider);
  const connectedPapr = ERC20__factory.connect(paprToken, provider);

  const underlyingDecimals = await connectedPhUSDC.decimals();

  const totalNFTWorth = (
    await Promise.all(
      connectedERC721.map(async (erc721) => {
        return (await erc721.balanceOf(address)).mul(
          ethers.utils.parseUnits(
            oracleInfo[erc721.address].price.toString(),
            underlyingDecimals,
          ),
        );
      }),
    )
  ).reduce((a, b) => b.add(a));

  const [totalPhUSDCBalance, totalPaprBalance, userVaults] = await Promise.all([
    connectedPhUSDC.balanceOf(address),
    connectedPapr.balanceOf(address),
    getAllVaultsForControllerForUser(
      configs.paprHero.controllerAddress,
      address,
    ),
  ]);

  const totalPaprDebt = userVaults
    .map((v) => ethers.BigNumber.from(v.debt))
    .reduce((a, b) => a.add(b), ethers.BigNumber.from(0));

  const netPapr = totalPaprBalance.sub(totalPaprDebt);
  let netPaprInUnderlying: ethers.BigNumber;
  if (netPapr.isZero()) {
    netPaprInUnderlying = ethers.BigNumber.from(0);
  } else {
    netPaprInUnderlying = await getQuoteForSwap(
      netPapr,
      paprToken,
      underlying,
      'paprHero',
    );
  }

  const totalBalance = totalNFTWorth
    .add(totalPhUSDCBalance)
    .add(netPaprInUnderlying);

  return {
    totalNFTWorth: parseFloat(
      ethers.utils.formatUnits(totalNFTWorth, underlyingDecimals),
    ),
    totalPhUSDCBalance: parseFloat(
      ethers.utils.formatUnits(totalPhUSDCBalance, underlyingDecimals),
    ),
    netPapr: parseFloat(ethers.utils.formatUnits(netPapr, underlyingDecimals)),
    totalBalance: parseFloat(
      ethers.utils.formatUnits(totalBalance, underlyingDecimals),
    ),
  };
}
