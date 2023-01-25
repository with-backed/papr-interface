import { TransactionButton } from 'components/Button';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { formatBigNum } from 'lib/numberFormat';
import { useMemo, useState } from 'react';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';
import styles from './AuctionApproveAndBuy.module.css';
import { ApproveTokenButton } from 'components/Controllers/OpenVault/LoanWriteButtons/UpdateLoanButtons';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import PaprControllerABI from 'abis/PaprController.json';
import { INFTEDA } from 'types/generated/abis/PaprController';
import {
  getOraclePayloadFromReservoirObject,
  OraclePriceType,
} from 'lib/oracle/reservoir';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';

type AuctionApproveAndBuyProps = {
  auction: NonNullable<AuctionQuery['auction']>;
  liveAuctionPrice: ethers.BigNumber;
  refresh: () => void;
};

export default function AuctionApproveAndBuy({
  auction,
  liveAuctionPrice,
  refresh,
}: AuctionApproveAndBuyProps) {
  const controller = useController();
  const [paprTokenApproved, setPaprTokenApproved] = useState<boolean>(false);

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
        <div></div>
        <div>
          <ApproveTokenButton
            token={controller.paprToken}
            tokenApproved={paprTokenApproved}
            setTokenApproved={setPaprTokenApproved}
          />
          <BuyButton
            auction={auction}
            liveAuctionPrice={liveAuctionPrice}
            tokenApproved={paprTokenApproved}
            refresh={refresh}
          />
        </div>
      </div>
    </div>
  );
}

const overrides = {
  gasLimit: ethers.BigNumber.from(ethers.utils.hexValue(3000000)),
};

type BuyButtonProps = {
  auction: NonNullable<AuctionQuery['auction']>;
  liveAuctionPrice: ethers.BigNumber;
  tokenApproved: boolean;
  refresh: () => void;
};

function BuyButton({
  auction,
  liveAuctionPrice,
  tokenApproved,
  refresh,
}: BuyButtonProps) {
  const { address } = useAccount();
  const controller = useController();
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const purchaseArgs = useMemo(() => {
    if (!oracleInfo || !address) return null;
    const auctionArg: INFTEDA.AuctionStruct = {
      auctionAssetContract: auction.auctionAssetContract.id,
      auctionAssetID: auction.auctionAssetID,
      nftOwner: auction.vault.account,
      paymentAsset: auction.paymentAsset.id,
      perPeriodDecayPercentWad: auction.perPeriodDecayPercentWad,
      secondsInPeriod: auction.secondsInPeriod,
      startPrice: auction.startPrice,
    };
    const maxPrice = liveAuctionPrice;
    const sendTo = address;
    const oracleDetails = oracleInfo[auction.auctionAssetContract.id];
    const oracleInfoStruct = getOraclePayloadFromReservoirObject(oracleDetails);

    return { auctionArg, maxPrice, sendTo, oracleInfoStruct };
  }, [auction, liveAuctionPrice, address, oracleInfo]);
  const { config } = usePrepareContractWrite({
    address: controller.id as `0x${string}`,
    functionName: 'purchaseLiquidationAuctionNFT',
    abi: PaprControllerABI.abi,
    args: [
      purchaseArgs?.auctionArg,
      purchaseArgs?.maxPrice,
      purchaseArgs?.sendTo,
      purchaseArgs?.oracleInfoStruct,
    ],
    overrides,
  });

  const { data, write, error } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      data.wait().then(refresh);
    },
  } as any);

  return (
    <TransactionButton
      kind="regular"
      size="small"
      theme="papr"
      disabled={!tokenApproved}
      onClick={write!}
      transactionData={data}
      text="Purchase"
      error={error?.message}
    />
  );
}
