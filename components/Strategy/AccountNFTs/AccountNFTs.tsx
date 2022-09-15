import { Fieldset } from 'components/Fieldset';
import { getAddress } from 'ethers/lib/utils';
import { CenterUserNFTsResponse, useCenterNFTs } from 'hooks/useCenterNFTs';
import { useConfig } from 'hooks/useConfig';
import { erc721Contract } from 'lib/contracts';
import { LendingStrategy } from 'lib/strategies';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
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

const getUniqueNFTId = (address: string, tokenId: string): string =>
  `${getAddress(address)}-${tokenId}`;

export const deconstructFromId = (id: string): [string, string] => {
  const indexOfDash = id.indexOf('-');
  const address = id.substring(0, indexOfDash);
  const tokenId = id.substring(indexOfDash + 1);
  return [address, tokenId];
};

export default function AccountNFTs({
  strategy,
  userCollectionNFTs,
  nftsLoading,
  nftsSelected,
  setNFTsSelected,
}: AccountNFTsProps) {
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const [nftsApproved, setNFTsApproved] = useState<string[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState<{
    [key: string]: boolean;
  }>({});

  const collateralContract = useMemo(() => {
    return erc721Contract(strategy.collateral.contract.address, signer!);
  }, [strategy, signer]);

  const isNFTApproved = useCallback(
    async (tokenId: string) => {
      const approved =
        getAddress(await collateralContract.getApproved(tokenId)) ===
          getAddress(strategy.contract.address) ||
        (await collateralContract.isApprovedForAll(
          address!,
          strategy.contract.address,
        ));
      return approved;
    },
    [strategy, collateralContract, address],
  );

  const initializeNFTsApproved = useCallback(async () => {
    const nftApprovals = await Promise.all(
      userCollectionNFTs.map(async (nft) => {
        return (await isNFTApproved(nft.tokenId))
          ? getUniqueNFTId(nft.address, nft.tokenId)
          : '';
      }),
    );
    setNFTsApproved(nftApprovals.filter((id) => !!id));
    setNFTsSelected(nftApprovals.filter((id) => !!id));
  }, [userCollectionNFTs, isNFTApproved]);

  useEffect(() => {
    if (nftsLoading) return;
    initializeNFTsApproved();
  }, [nftsLoading]);

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

  const approveNFT = useCallback(
    async (tokenId: string) => {
      setApprovalsLoading((prevApprovalsLoading) => ({
        ...prevApprovalsLoading,
        [getUniqueNFTId(collateralContract.address, tokenId)]: true,
      }));
      const t = await collateralContract.approve(
        strategy.contract.address,
        tokenId,
      );
      t.wait().then(() => {
        setApprovalsLoading((prevApprovalsLoading) => ({
          ...prevApprovalsLoading,
          [getUniqueNFTId(collateralContract.address, tokenId)]: false,
        }));
        setNFTsApproved((prevNFTsApproved) => [
          ...prevNFTsApproved,
          getUniqueNFTId(collateralContract.address, tokenId),
        ]);
      });
    },
    [strategy, collateralContract, setApprovalsLoading, setNFTsApproved],
  );

  const performApproveAll = useCallback(async () => {
    userCollectionNFTs
      .map((nft) => getUniqueNFTId(nft.address, nft.tokenId))
      .filter((id) => !nftsApproved.includes(id))
      .map((id) => deconstructFromId(id)[1])
      .forEach((tokenId) => {
        setApprovalsLoading((prevApprovalsLoading) => ({
          ...prevApprovalsLoading,
          [getUniqueNFTId(collateralContract.address, tokenId)]: true,
        }));
      });

    await collateralContract
      .setApprovalForAll(strategy.contract.address, true)
      .then(() => {
        setApprovalsLoading({});
      });
  }, [collateralContract, strategy]);

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
                    {nftsApproved.includes(
                      getUniqueNFTId(nft.address, nft.tokenId),
                    ) ? (
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
                    ) : (
                      <>
                        {!approvalsLoading[
                          getUniqueNFTId(nft.address, nft.tokenId)
                        ] && (
                          <p
                            className={styles.approve}
                            onClick={() => approveNFT(nft.tokenId)}>
                            Approve
                          </p>
                        )}
                        {approvalsLoading[
                          getUniqueNFTId(nft.address, nft.tokenId)
                        ] && <p>...</p>}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.selectAll}>
          {nftsApproved.length > 0 && (
            <>
              {noneSelected && <p onClick={performSelectAll}>Select All</p>}
              {!noneSelected && (
                <p onClick={performUnselectAll}>Unselect All</p>
              )}
            </>
          )}
          {nftsApproved.length === 0 && (
            <>
              <p onClick={performApproveAll}>Approve All</p>
            </>
          )}
        </div>
      </div>
    </Fieldset>
  );
}
