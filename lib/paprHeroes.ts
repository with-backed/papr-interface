import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { ERC721__factory } from 'types/generated/abis';
import { PHUSDC__factory } from 'types/generated/abis/factories/PHUSDC__factory';
import { configs } from './config';
import { makeProvider } from './contracts';
import { ReservoirResponseData } from './oracle/reservoir';

export async function calculateNetPhUSDCBalance(
  address: string,
  allowedCollateral: string[],
  oracleInfo: { [key: string]: ReservoirResponseData },
): Promise<ethers.BigNumber> {
  const provider = makeProvider(configs.paprHero.jsonRpcProvider, 'paprHero');
  const connectedERC721 = allowedCollateral.map((c) =>
    ERC721__factory.connect(
      c,
      makeProvider(configs.paprHero.jsonRpcProvider, 'paprHero'),
    ),
  );
  const connectedPhUSDC = PHUSDC__factory.connect(
    configs.paprHero.paprUnderlyingAddress,
    provider,
  );
  const decimals = await connectedPhUSDC.decimals();

  const totalNFTWorth = (
    await Promise.all(
      connectedERC721.map(async (erc721) => {
        return (await erc721.balanceOf(address)).mul(
          ethers.utils.parseUnits(
            oracleInfo[getAddress(erc721.address)].price.toString(),
            decimals,
          ),
        );
      }),
    )
  ).reduce((a, b) => b.add(a));

  const totalPhUSDCBalance = await connectedPhUSDC.balanceOf(address);

  return totalNFTWorth.add(totalPhUSDCBalance);
}
