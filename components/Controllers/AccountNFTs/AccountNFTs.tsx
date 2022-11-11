import { Fieldset } from 'components/Fieldset';
import { deconstructFromId, getUniqueNFTId } from 'lib/controllers';
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import styles from './AccountNFTs.module.css';
import { useAccount } from 'wagmi';
import { useQuery } from 'urql';
import { VaultsByOwnerForControllerDocument } from 'types/generated/graphql/inKindSubgraph';
import { getAddress } from 'ethers/lib/utils';
import { CenterAsset } from 'components/CenterAsset';
import { PaprController } from 'lib/PaprController';

export type AccountNFTsProps = {
  controller: PaprController;
  userCollectionNFTs: string[];
  nftsLoading: boolean;
  nftsSelected: string[];
  setNFTsSelected: Dispatch<SetStateAction<string[]>>;
};

export function AccountNFTs({
  controller,
  userCollectionNFTs,
  nftsLoading,
  nftsSelected,
  setNFTsSelected,
}: AccountNFTsProps) {
  const { address } = useAccount();
  const [{ data: userVaultsData, fetching: vaultsFetching }] = useQuery({
    query: VaultsByOwnerForControllerDocument,
    variables: {
      owner: address?.toLowerCase(),
      controller: controller.id.toLowerCase(),
    },
  });

  const oracleInfo = useMemo(() => {
    return controller.oracleInfo;
  }, [controller]);
  const userVaultNFTIds = useMemo(() => {
    return userVaultsData?.vaults
      .map((vault) =>
        vault.collateral.map((c) =>
          getUniqueNFTId(c.contractAddress, c.tokenId),
        ),
      )
      .flat();
  }, [userVaultsData]);

  const handleNFTSelected = useCallback(
    (address: string, tokenId: string, checked: boolean) => {
      setNFTsSelected((prevNFTSelected) => {
        const uniqueNFTId = getUniqueNFTId(address, tokenId);
        return checked
          ? [...prevNFTSelected, uniqueNFTId]
          : prevNFTSelected.filter((s) => s !== uniqueNFTId);
      });
    },
    [setNFTsSelected],
  );

  const noneSelected = useMemo(() => {
    return nftsSelected.length === 0;
  }, [nftsSelected]);

  const performSelectAll = useCallback(() => {
    setNFTsSelected(userCollectionNFTs);
  }, [userCollectionNFTs, setNFTsSelected]);

  const performUnselectAll = useCallback(() => {
    setNFTsSelected([]);
  }, [setNFTsSelected]);

  if (nftsLoading || vaultsFetching) return <></>;

  return (
    <Fieldset legend="🖼️ collateral">
      <div className={styles.wrapper}>
        {!address && (
          <div>
            <p>
              Connect wallet to see if you have NFTs that this controller lends
              to.
            </p>
          </div>
        )}
        {userCollectionNFTs.length === 0 && !!address && (
          <div>
            <p>
              This lending controller currently does not use any of your NFTs as
              collateral.
            </p>
          </div>
        )}
        {userCollectionNFTs.length > 0 && (
          <>
            <div className={styles.nfts}>
              <ol>
                <li className={`${styles.row} ${styles.columnLabels}`}>
                  <div className={styles.imageTokenId}></div>
                  <div className={styles.oracleCheckBox}>
                    <div>
                      <p>oracle</p>
                    </div>
                    <div>
                      <p>deposit</p>
                    </div>
                  </div>
                </li>
                {userVaultNFTIds?.map((id, i) => {
                  const [address, tokenId] = deconstructFromId(id);

                  return (
                    <li className={styles.row} key={`${address}-${tokenId}`}>
                      <div className={styles.imageTokenId}>
                        <div className={styles.thumbnail}>
                          <CenterAsset address={address} tokenId={tokenId} />
                        </div>
                        <div>#{tokenId}</div>
                      </div>
                      <div className={styles.oracleCheckBox}>
                        <div>
                          <p>${oracleInfo[getAddress(address)].price}</p>
                        </div>
                        <div>
                          <input type="checkbox" disabled checked />
                        </div>
                      </div>
                    </li>
                  );
                })}
                {userCollectionNFTs.map((id, i) => {
                  const [address, tokenId] = deconstructFromId(id);
                  return (
                    <li className={styles.row} key={`${address}-${tokenId}`}>
                      <div className={styles.imageTokenId}>
                        <div className={styles.thumbnail}>
                          <CenterAsset address={address} tokenId={tokenId} />
                        </div>
                        <div>#{tokenId}</div>
                      </div>
                      <div className={styles.oracleCheckBox}>
                        <div>
                          <p>${oracleInfo[getAddress(address)].price}</p>
                        </div>
                        <div>
                          <input
                            type="checkbox"
                            checked={nftsSelected.includes(
                              getUniqueNFTId(address, tokenId),
                            )}
                            onChange={(e) =>
                              handleNFTSelected(
                                address,
                                tokenId,
                                e.target.checked,
                              )
                            }
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className={styles.selectAll}>
              <>
                {noneSelected && <p onClick={performSelectAll}>Select All</p>}
                {!noneSelected && (
                  <p onClick={performUnselectAll}>Unselect All</p>
                )}
              </>
            </div>
          </>
        )}
      </div>
    </Fieldset>
  );
}
