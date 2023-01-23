import { TransactionButton } from 'components/Button';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { formatBigNum } from 'lib/numberFormat';
import { useState } from 'react';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';
import styles from './AuctionApproveAndBuy.module.css';
import { ApproveTokenButton } from 'components/Controllers/OpenVault/LoanWriteButtons/UpdateLoanButtons';

type AuctionApproveAndBuyProps = {
  auction: NonNullable<AuctionQuery['auction']>;
  liveAuctionPrice: ethers.BigNumber;
};

export default function AuctionApproveAndBuy({
  auction,
  liveAuctionPrice,
}: AuctionApproveAndBuyProps) {
  const controller = useController();
  const [debtTokenApproved, setDebtTokenApproved] = useState<boolean>(false);

  return (
    <div className={styles.wrapper}>
      <div className={styles.currentPriceRowWrapper}>
        <div></div>
        <div className={styles.currentPriceRow}>
          <div>
            <p>Current price</p>
          </div>
          <div>
            <p>
              {formatBigNum(liveAuctionPrice, controller.paprToken.decimals)}{' '}
              {controller.paprToken.symbol}
            </p>
          </div>
        </div>
      </div>
      <div className={styles.approveAndBuy}>
        <ApproveTokenButton
          token={controller.paprToken}
          tokenApproved={debtTokenApproved}
          setTokenApproved={setDebtTokenApproved}
        />
      </div>
    </div>
  );
}
