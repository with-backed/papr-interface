import styles from './YourBorrowPositions.module.css';
import { CenterUserNFTsResponse } from 'hooks/useCenterNFTs';
import { Fieldset } from 'components/Fieldset';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';
import { PaprController } from 'lib/PaprController';
import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { Quoter } from 'lib/contracts';
import { SupportedToken } from 'lib/config';
import { useConfig } from 'hooks/useConfig';
import { getQuoteForSwap } from 'lib/controllers';

export type YourBorrowPositionsProps = {
  paprController: PaprController;
  userNFTs: CenterUserNFTsResponse[];
};

export function YourBorrowPositions({
  paprController,
  userNFTs,
}: YourBorrowPositionsProps) {
  const { address } = useAccount();
  const { jsonRpcProvider, tokenName } = useConfig();
  const oracleInfo = useOracleInfo();

  console.log({ oracleInfo });

  const { currentVaults, vaultsFetching } = useCurrentVaults(
    paprController,
    address,
  );

  const uniqueCollections = useMemo(() => {
    return userNFTs
      .map((nft) => nft.address)
      .filter((item, i, arr) => arr.indexOf(item) === i);
  }, [userNFTs]);

  const maxLoanAmountInUnderlying = useAsyncValue(async () => {
    const maxLoanInDebtTokens = await paprController.maxDebt(
      userNFTs,
      oracleInfo,
    );
    return maxLoanInDebtTokens;
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwap(
      quoter,
      maxLoanInDebtTokens,
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [jsonRpcProvider, tokenName, paprController, oracleInfo, userNFTs]);

  const totalPaprMemeDebt = useMemo(() => {
    if (!currentVaults) return ethers.BigNumber.from(0);
    return currentVaults
      .map((vault) => vault.debt)
      .reduce((a, b) => ethers.BigNumber.from(a).add(ethers.BigNumber.from(b)));
  }, [currentVaults]);

  if (vaultsFetching) return <></>;

  return (
    <Fieldset legend="🧮 YOUR paprMEME POSITIONS">
      <div>{totalPaprMemeDebt.isZero() && <p>No {tokenName} loans yet</p>}</div>
      <div>
        Based on the NFTs in your wallet, you&apos;re eligible for loans from{' '}
        {uniqueCollections.length} collection(s), with a max loan amount of{' '}
        {!maxLoanAmountInUnderlying && <span>...</span>}
        {maxLoanAmountInUnderlying &&
          ethers.utils.formatUnits(
            maxLoanAmountInUnderlying,
            paprController.underlying.decimals,
          )}
      </div>
    </Fieldset>
  );
}
