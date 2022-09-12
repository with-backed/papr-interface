import { Fieldset } from 'components/Fieldset';
import { getAddress } from 'ethers/lib/utils';
import { useRenderNFTs } from 'hooks/useCenterNFTs';
import { useConfig } from 'hooks/useConfig';
import { erc721Contract } from 'lib/contracts';
import { LendingStrategy } from 'lib/strategies';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useSigner } from 'wagmi';
import styles from './AccountNFTs.module.css';

export type AccountNFTsProps = {
  strategy: LendingStrategy;
};

const getUniqueNFTId = (address: string, tokenId: string): string =>
  `${address}-${tokenId}`;

export default function AccountNFTs({ strategy }: AccountNFTsProps) {
  const { address } = useAccount();
  const config = useConfig();
  const { data: signer } = useSigner();
  const { userCollectionNFTs, nftsLoading } = useRenderNFTs(
    address,
    strategy.collateral.contract.address,
    config,
  );
  const [nftSelected, setNFTSelected] = useState<string[]>([]);
  const [nftsApproved, setNFTsApproved] = useState<string[]>([]);

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
  }, [userCollectionNFTs, isNFTApproved]);

  useEffect(() => {
    if (nftsLoading) return;
    initializeNFTsApproved();
  }, [, nftsLoading]);

  const handleNFTSelected = useCallback(
    (address: string, tokenId: string, checked: boolean) => {
      setNFTSelected((prevNFTSelected) => {
        const uniqueNFTId = getUniqueNFTId(address, tokenId);
        return checked
          ? [...prevNFTSelected, uniqueNFTId]
          : prevNFTSelected.filter((s) => s !== uniqueNFTId);
      });
    },
    [setNFTSelected],
  );

  const noneSelected = useMemo(() => {
    return nftSelected.length === 0;
  }, [nftSelected]);

  const performSelectAll = useCallback(() => {
    setNFTSelected(
      userCollectionNFTs.map((nft) => getUniqueNFTId(nft.address, nft.tokenId)),
    );
  }, [userCollectionNFTs, setNFTSelected]);

  const performUnselectAll = useCallback(() => {
    setNFTSelected([]);
  }, [setNFTSelected]);

  const approveNFT = useCallback(
    async (tokenId: string) => {
      const t = await collateralContract.approve(
        strategy.contract.address,
        tokenId,
      );
    },
    [strategy],
  );

  const performApproveAll = useCallback(async () => {
    const t = await collateralContract.setApprovalForAll(
      strategy.contract.address,
      true,
    );
  }, [collateralContract]);

  if (nftsLoading) return <></>;

  return (
    <Fieldset legend="🖼️ Vault">
      <div className={styles.wrapper}>
        <div className={styles.nfts}>
          <div className={`${styles.row} ${styles.columnLabels}`}>
            <div className={styles.imageTokenId}></div>
            <div className={styles.oracleCheckBox}>
              <div>
                <p>oracle</p>
              </div>
              <div>
                <p>deposit</p>
              </div>
            </div>
          </div>
          {userCollectionNFTs.map((nft, i) => (
            <div
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
                      checked={nftSelected.includes(
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
                    <p
                      className={styles.approve}
                      onClick={() => approveNFT(nft.tokenId)}>
                      Approve
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
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
