import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { LendingStrategy } from 'lib/strategies';
import { useCallback, useEffect, useState } from 'react';
import { ERC721__factory } from 'types/generated/abis';
import { OpenVaultRequestStruct } from 'types/generated/abis/Strategy';
import { useAccount, useSigner } from 'wagmi';

type BorrowProps = {
  strategy: LendingStrategy;
};

const PRICE = 20_000;

export default function OpenVault({ strategy }: BorrowProps) {
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const [debt, setDebt] = useState<string>('');
  const [maxDebt, setMaxDebt] = useState<string>('');
  const [collateralTokenId, setCollateralTokenId] = useState<string>('');
  const { jsonRpcProvider, network } = useConfig();

  const create = useCallback(async () => {
    const request: OpenVaultRequestStruct = {
      mintTo: address!,
      debt: ethers.utils.parseUnits(debt, strategy.underlying.decimals),
      collateral: {
        nft: strategy.collateral.contract.address,
        id: ethers.BigNumber.from(collateralTokenId),
      },
      oracleInfo: {
        price: ethers.utils.parseUnits(PRICE.toString(), 18),
        period: ethers.BigNumber.from(0),
      },
      sig: {
        v: ethers.BigNumber.from(1),
        r: ethers.utils.formatBytes32String('x'),
        s: ethers.utils.formatBytes32String('y'),
      },
    };

    const signerCollateral = ERC721__factory.connect(
      strategy.collateral.contract.address,
      signer!,
    );

    const requestEncodedWithSelector =
      strategy.contract.interface.encodeFunctionData('openVault', [request]);
    const requestEncodedWithoutSelector =
      '0x' + requestEncodedWithSelector.substring(10);

    await signerCollateral['safeTransferFrom(address,address,uint256,bytes)'](
      address!,
      strategy.contract.address,
      ethers.BigNumber.from(collateralTokenId),
      requestEncodedWithoutSelector,
    );

    const filter = strategy.debtVault.filters.Transfer(null, address, null);

    strategy.debtVault.once(filter, (from, to, id) => {
      window.location.assign(
        `/network/${network}/in-kind/strategies/${strategy.contract.address}/vaults/${id}`,
      );
    });
  }, [strategy, debt, collateralTokenId]);

  const getMaxDebt = useCallback(async () => {
    const newNorm = await strategy.contract.newNorm();
    const maxLTV = await strategy.contract.maxLTV();

    const maxDebt = maxLTV.mul(ethers.BigNumber.from(PRICE)).div(newNorm);

    setMaxDebt(maxDebt.toString());
  }, [strategy]);

  useEffect(() => {
    getMaxDebt();
  }, []);

  return (
    <fieldset>
      <legend>borrow</legend>
      <p> max debt: {maxDebt}</p>
      <input
        placeholder="collateral token id"
        onChange={(e) => setCollateralTokenId(e.target.value)}></input>
      <input
        placeholder="debt amount"
        onChange={(e) => setDebt(e.target.value)}></input>
      <button onClick={create}> borrow </button>
    </fieldset>
  );
}
