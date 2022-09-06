import { TickMath } from '@uniswap/v3-sdk';
import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import { SupportedNetwork } from 'lib/config';
import { Quoter } from 'lib/contracts';
import {
  LendingStrategy,
  computeLiquidationEstimation,
  getQuoteForSwap,
  computeSlippageForSwap,
} from 'lib/strategies';
import { useCallback, useEffect, useState } from 'react';
import { ERC721__factory } from 'types/generated/abis';
import { ILendingStrategy } from 'types/generated/abis/Strategy';
import { useAccount, useSigner } from 'wagmi';

type BorrowProps = {
  strategy: LendingStrategy;
};

interface OnERC721ReceivedArgsStruct {
  vaultId: ethers.BigNumber;
  vaultNonce: ethers.BigNumber;
  mintVaultTo: string;
  mintDebtOrProceedsTo: string;
  minOut: ethers.BigNumber;
  debt: ethers.BigNumber;
  sqrtPriceLimitX96: ethers.BigNumber;
  oracleInfo: ILendingStrategy.OracleInfoStruct;
  sig: ILendingStrategy.SigStruct;
}

const PRICE = 20_000;

const OnERC721ReceivedArgsEncoderString = `
  tuple(
    uint256 vaultId,
    uint256 vaultNonce,
    address mintVaultTo,
    address mintDebtOrProceedsTo,
    uint256 minOut,
    int256 debt,
    uint160 sqrtPriceLimitX96,
    tuple(uint128 price, uint8 period) oracleInfo,
    tuple(uint8 v, bytes32 r, bytes32 s) sig
  )
`;

export default function OpenVault({ strategy }: BorrowProps) {
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const [debt, setDebt] = useState<string>('');
  const [maxDebt, setMaxDebt] = useState<string>('');
  const [collateralTokenId, setCollateralTokenId] = useState<string>('');
  const [liquidationDateEstimation, setLiquidationDateEstimation] =
    useState<string>('');
  const [swapAmount, setSwapAmount] = useState<string>('');
  const {
    quoteForSwap,
    priceImpact,
    tokenOut,
    quoteLoading,
    priceImpactLoading,
  } = useQuoteWithSlippage(strategy, swapAmount, true);
  const { network } = useConfig();

  const create = useCallback(
    async (withSwap: boolean) => {
      const tickUpper = strategy.token0IsUnderlying ? 200 : 0;
      const tickLower = strategy.token0IsUnderlying ? -200 : 0;

      const request: OnERC721ReceivedArgsStruct = {
        vaultId: ethers.BigNumber.from(0),
        vaultNonce: ethers.BigNumber.from(0),
        mintVaultTo: address!,
        mintDebtOrProceedsTo: address!,
        minOut: withSwap
          ? ethers.utils.parseUnits(quoteForSwap, tokenOut.decimals)
          : ethers.BigNumber.from(0),
        sqrtPriceLimitX96: ethers.BigNumber.from(
          TickMath.getSqrtRatioAtTick(
            strategy.token0IsUnderlying ? tickUpper - 1 : tickLower - 1,
          ).toString(),
        ),
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
        {
          gasLimit: ethers.utils.hexValue(3000000),
        },
      );

      const filter = strategy.contract.filters.OpenVault(null, address, null);

      strategy.contract.once(filter, (id, to, nonce) => {
        window.location.assign(
          `/network/${network}/in-kind/strategies/${strategy.contract.address}/vaults/${id}`,
        );
      });
    },
    [address, collateralTokenId, debt, network, signer, strategy, quoteForSwap],
  );

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
    [maxDebt, setDebt, strategy],
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
      <button disabled={!address} onClick={() => create(false)}>
        borrow
      </button>
      <br />
      <input
        placeholder="collateral token id"
        onChange={(e) => setCollateralTokenId(e.target.value)}></input>
      <input
        placeholder="debt amount"
        onChange={(e) => handleMaxDebtChanged(e.target.value)}></input>
      <input
        placeholder="debt to swap"
        onChange={(e) => setSwapAmount(e.target.value)}></input>
      <button onClick={() => create(true)}> borrow and swap</button>
      {!quoteLoading && (
        <p>
          {' '}
          quote for desired swap {quoteForSwap}
          {tokenOut.symbol}
        </p>
      )}
      {!priceImpactLoading && <p>price impact {priceImpact}%</p>}
      <p>
        {' '}
        # days before liquidation (estimation): {liquidationDateEstimation}{' '}
      </p>
    </Fieldset>
  );
}
