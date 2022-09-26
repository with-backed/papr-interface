import { Fieldset } from 'components/Fieldset';
import { CenterUserNFTsResponse } from 'hooks/useCenterNFTs';
import { getUniqueNFTId } from 'lib/strategies';
import { LendingStrategy } from 'lib/LendingStrategy';
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import styles from './AccountNFTs.module.css';
import { useAccount } from 'wagmi';

export type AccountNFTsProps = {
  strategy: LendingStrategy;
  userCollectionNFTs: CenterUserNFTsResponse[];
  nftsLoading: boolean;
  nftsSelected: string[];
  setNFTsSelected: Dispatch<SetStateAction<string[]>>;
};

export function AccountNFTs({
  strategy,
  userCollectionNFTs,
  nftsLoading,
  nftsSelected,
  setNFTsSelected,
}: AccountNFTsProps) {
  const { address } = useAccount();
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
    setNFTsSelected(
      userCollectionNFTs.map((nft) => getUniqueNFTId(nft.address, nft.tokenId)),
    );
  }, [userCollectionNFTs, setNFTsSelected]);

  const performUnselectAll = useCallback(() => {
    setNFTsSelected([]);
  }, [setNFTsSelected]);

  if (nftsLoading) return <></>;

  return (
    <Fieldset legend="🖼️ collateral">
      <div className={styles.wrapper}>
        {!address && (
          <div>
            <p>
              Connect wallet to see if you have NFTs that this strategy lends
              to.
            </p>
          </div>
        )}
        {userCollectionNFTs.length === 0 && !!address && (
          <div>
            <p>
              This lending strategy currently does not use any of your NFTs as
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
                {userCollectionNFTs.map((nft, i) => (
                  <li
                    className={`${styles.row} ${
                      i % 2 === 0 ? styles.even : ''
                    }`}
                    key={`${nft.address}-${nft.tokenId}`}>
                    <div className={styles.imageTokenId}>
                      <div>
                        <img src={nft.smallPreviewImageUrl} />
                      </div>
                      <div>#{nft.tokenId}</div>
                    </div>
                    <div className={styles.oracleCheckBox}>
                      <div>
                        <p>$72,188</p>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          checked={nftsSelected.includes(
                            getUniqueNFTId(nft.address, nft.tokenId),
                          )}
                          onChange={(e) =>
                            handleNFTSelected(
                              nft.address,
                              nft.tokenId,
                              e.target.checked,
                            )
                          }
                        />
                      </div>
                    </div>
                  </li>
                ))}
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
