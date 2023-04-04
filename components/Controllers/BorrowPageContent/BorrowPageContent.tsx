import controllerStyles from 'components/Controllers/Controller.module.css';
import { getAddress } from 'ethers/lib/utils';
import { useAccountNFTs } from 'hooks/useAccountNFTs';
import { useController } from 'hooks/useController';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { usePaprBalance } from 'hooks/usePaprBalance';
import { OraclePriceType } from 'lib/oracle/reservoir';
import dynamic from 'next/dynamic';
import React, { useCallback, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';

import { VaultLoansHistory } from '../VaultLoansHistory/VaultLoansHistory';

const YourPositions = dynamic(() =>
  import('components/YourPositions').then((mod) => mod.YourPositions),
);
const Activity = dynamic(() =>
  import('components/Controllers/Activity').then((mod) => mod.Activity),
);
const VaultDebtPicker = dynamic(() =>
  import(
    'components/Controllers/OpenVault/VaultDebtPicker/VaultDebtPicker'
  ).then((mod) => mod.VaultDebtPicker),
);

export function BorrowPageContent() {
  const paprController = useController();
  const { address } = useAccount();
  const oracleInfo = useOracleInfo(OraclePriceType.lower);

  const collateralContractAddresses = useMemo(() => {
    return paprController.allowedCollateral.map((ac) => ac.token.id);
  }, [paprController.allowedCollateral]);

  const { userCollectionNFTs, reexecuteQuery: refreshAccountNFTs } =
    useAccountNFTs(address, collateralContractAddresses);

  const { currentVaults, reexecuteQuery: refreshCurrentVaults } =
    useCurrentVaults(address);

  const { refresh: refreshBalance } = usePaprBalance(
    paprController.paprToken.id,
  );

  const refresh = useCallback(() => {
    refreshAccountNFTs({ requestPolicy: 'cache-and-network' });
    refreshCurrentVaults({ requestPolicy: 'cache-and-network' });
    refreshBalance();
  }, [refreshAccountNFTs, refreshBalance, refreshCurrentVaults]);

  const uniqueCollections = useMemo(() => {
    const userCollectionCollateral = userCollectionNFTs.map((nft) =>
      getAddress(nft.address),
    );

    if (!currentVaults) return Array.from(new Set(userCollectionCollateral));

    const userAndVaultCollateral = currentVaults
      .map((v) => getAddress(v.token.id))
      .concat(userCollectionCollateral);

    return Array.from(new Set(userAndVaultCollateral));
  }, [userCollectionNFTs, currentVaults]);

  const [showHistory, setShowHistory] = useState<{ [key: string]: boolean }>(
    {},
  );

  if (!paprController || !oracleInfo) {
    return <></>;
  }

  return (
    <div className={controllerStyles.wrapper}>
      <YourPositions />
      {!!address &&
        uniqueCollections.map((collection) => {
          const vault = currentVaults?.find(
            (v) => getAddress(v.token.id) === getAddress(collection),
          );
          const vaultId = vault!.id;
          return (
            <>
              <button
                onClick={() =>
                  setShowHistory((prev) => ({
                    ...prev,
                    [vaultId]: !prev[vaultId],
                  }))
                }>
                history
              </button>
              {showHistory[vaultId] && <VaultLoansHistory vault={vault!} />}
              {!showHistory[vaultId] && (
                <VaultDebtPicker
                  key={collection}
                  collateralContractAddress={collection}
                  oracleInfo={oracleInfo}
                  vault={vault}
                  userNFTsForVault={userCollectionNFTs.filter(
                    (nft) => getAddress(collection) === getAddress(nft.address),
                  )}
                  refresh={refresh}
                />
              )}
            </>
          );
        })}
      {!!address && <Activity account={address} />}
    </div>
  );
}
