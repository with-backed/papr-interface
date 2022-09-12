import { Fieldset } from 'components/Fieldset';
import { useRenderNFTs } from 'hooks/useCenterNFTs';
import { useConfig } from 'hooks/useConfig';
import { LendingStrategy } from 'lib/strategies';
import { useAccount } from 'wagmi';
import styles from './AccountNFTs.module.css';

export type AccountNFTsProps = {
  strategy: LendingStrategy;
};

export default function AccountNFTs({ strategy }: AccountNFTsProps) {
  const { address } = useAccount();
  const config = useConfig();
  const { userCollectionNFTs, nftsLoading } = useRenderNFTs(
    address,
    strategy.collateral.contract.address,
    config,
  );

  if (nftsLoading) return <></>;

  console.log({ userCollectionNFTs });

  return (
    <Fieldset legend="Vault">
      <div className={styles.wrapper}>
        <div className={styles.nfts}>
          <div className={`${styles.row}`}>
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
                  <input type="checkbox" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Fieldset>
  );
}
