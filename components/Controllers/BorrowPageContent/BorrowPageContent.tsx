import controllerStyles from 'components/Controllers/Controller.module.css';
import { getAddress } from 'ethers/lib/utils';
import { useAccountNFTs } from 'hooks/useAccountNFTs';
import { useConfig } from 'hooks/useConfig';
import { useController } from 'hooks/useController';
import { useCurrentVaults } from 'hooks/useCurrentVault/useCurrentVault';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { usePaprBalance } from 'hooks/usePaprBalance';
import { SupportedToken } from 'lib/config';
import { OraclePriceType } from 'lib/oracle/reservoir';
import { lpActivityForUser } from 'lib/pAPRSubgraph';
import dynamic from 'next/dynamic';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';

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
  const config = useConfig();
  const paprController = useController();
  const { address } = useAccount();
  const oracleInfo = useOracleInfo(OraclePriceType.lower);

  useEffect(() => {
    lpActivityForUser(
      paprController,
      '0x82c1B61dA09b5FDce098a212Bb8070210AB91049'.toLowerCase(),
      config.tokenName as SupportedToken,
    );
  });

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

  if (!paprController || !oracleInfo) {
    return <></>;
  }

  return (
    <div className={controllerStyles.wrapper}>
      <YourPositions />
      {!!address &&
        uniqueCollections.map((collection) => (
          <VaultDebtPicker
            key={collection}
            collateralContractAddress={collection}
            oracleInfo={oracleInfo}
            vault={currentVaults?.find(
              (v) => getAddress(v.token.id) === getAddress(collection),
            )}
            userNFTsForVault={userCollectionNFTs.filter(
              (nft) => getAddress(collection) === getAddress(nft.address),
            )}
            refresh={refresh}
          />
        ))}
      {!!address && <Activity account={address} />}
    </div>
  );
}
