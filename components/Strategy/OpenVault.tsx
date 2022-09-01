import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { LendingStrategy, computeLiquidationEstimation } from 'lib/strategies';
import { useCallback, useEffect, useState } from 'react';
import { ERC721__factory } from 'types/generated/abis';
import { ILendingStrategy } from 'types/generated/abis/Strategy';
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
  const [liquidationDateEstimation, setLiquidationDateEstimation] =
    useState<string>('');
  const { network } = useConfig();

  interface OnERC721ReceivedArgsStruct {
    vaultId: ethers.BigNumber;
    mintVaultTo: string;
    mintDebtOrProceedsTo: string;
    minOut: ethers.BigNumber;
    debt: ethers.BigNumber;
    sqrtPriceLimitX96: ethers.BigNumber;
    oracleInfo: ILendingStrategy.OracleInfoStruct;
    sig: ILendingStrategy.SigStruct;
  }

  const OnERC721ReceivedArgsEncoderString = `
    tuple(
      uint256 vaultId;
      address mintVaultTo;
      address mintDebtOrProceedsTo;
      uint256 minOut;
      int256 debt;
      uint160 sqrtPriceLimitX96;
      tuple(uint128 price, uint8 period) oracleInfo;
      tuple(uint8 v, bytes32 r, bytes32 s) sig;
    )
  `;

  const create = useCallback(async () => {
    const request: OnERC721ReceivedArgsStruct = {
      vaultId: ethers.BigNumber.from(0),
      mintVaultTo: address!,
      mintDebtOrProceedsTo: address!,
      minOut: ethers.BigNumber.from(0),
      sqrtPriceLimitX96: ethers.BigNumber.from(0),
      debt: ethers.utils.parseUnits(debt, strategy.underlying.decimals),
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

    await signerCollateral['safeTransferFrom(address,address,uint256,bytes)'](
      address!,
      strategy.contract.address,
      ethers.BigNumber.from(collateralTokenId),
      ethers.utils.defaultAbiCoder.encode(
        [OnERC721ReceivedArgsEncoderString],
        [request],
      ),
    );

    const filter = strategy.contract.filters.OpenVault(null, address, null);

    strategy.contract.once(filter, (id, to, nonce) => {
      window.location.assign(
        `/network/${network}/in-kind/strategies/${strategy.contract.address}/vaults/${id}`,
      );
    });
  }, [address, collateralTokenId, debt, network, signer, strategy]);

  const handleMaxDebtChanged = useCallback(
    async (value: string) => {
      setDebt(value);

      if (value === '') {
        setLiquidationDateEstimation('');
        return;
      }

      setLiquidationDateEstimation(
        await (
          await computeLiquidationEstimation(
            ethers.BigNumber.from(value),
            ethers.BigNumber.from(maxDebt),
            strategy,
          )
        ).toString(),
      );
    },
    [setDebt, maxDebt],
  );

  const getMaxDebt = useCallback(async () => {
    const newNorm = await strategy.contract.newNorm();
    const maxLTV = await strategy.contract.maxLTV();

    const maxDebt = maxLTV.mul(ethers.BigNumber.from(PRICE)).div(newNorm);

    setMaxDebt(maxDebt.toString());
  }, [strategy]);

  useEffect(() => {
    getMaxDebt();
  }, [getMaxDebt]);

  return (
    <Fieldset legend="🏦 Borrow">
      <p> max debt: {maxDebt}</p>
      <input
        placeholder="collateral token id"
        onChange={(e) => setCollateralTokenId(e.target.value)}></input>
      <input
        placeholder="debt amount"
        onChange={(e) => handleMaxDebtChanged(e.target.value)}></input>
      <button onClick={create}> borrow </button>
      <p>
        {' '}
        # days before liquidation (estimation): {liquidationDateEstimation}{' '}
      </p>
    </Fieldset>
  );
}
