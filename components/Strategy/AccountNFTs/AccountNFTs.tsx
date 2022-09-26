import { Fieldset } from 'components/Fieldset';
import { getAddress } from 'ethers/lib/utils';
import { CenterUserNFTsResponse } from 'hooks/useCenterNFTs';
import { erc721Contract } from 'lib/contracts';
import { getUniqueNFTId } from 'lib/strategies';
import { LendingStrategy } from 'lib/LendingStrategy';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useAccount, useSigner } from 'wagmi';
import styles from './AccountNFTs.module.css';

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
  const { data: signer } = useSigner();

  const [approvalsLoading, setApprovalsLoading] = useState<{
    [key: string]: boolean;
  }>({});

  const collateralContract = useMemo(() => {
<<<<<<< HEAD
    return erc721Contract(strategy.collateralAddress, signer!);
=======
    return erc721Contract(strategy.allowedCollateral.contract.address, signer!);
>>>>>>> ff85274 (more progress)
  }, [strategy, signer]);

  const isNFTApproved = useCallback(
    async (tokenId: string) => {
      const approved =
        getAddress(await collateralContract.getApproved(tokenId)) ===
          getAddress(strategy.id) ||
        (await collateralContract.isApprovedForAll(address!, strategy.id));
      return approved;
    },
    [strategy, collateralContract, address],
  );

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
                className={`${styles.row} ${i % 2 === 0 ? styles.even : ''}`}
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
            {!noneSelected && <p onClick={performUnselectAll}>Unselect All</p>}
          </>
        </div>
      </div>
    </Fieldset>
  );
}
