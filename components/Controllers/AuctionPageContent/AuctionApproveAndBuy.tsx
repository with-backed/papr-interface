import PaprControllerABI from 'abis/PaprController.json';
import { TransactionButton } from 'components/Button';
import { ApproveTokenButton } from 'components/Controllers/ApproveButtons/ApproveTokenButton';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useOracleSynced } from 'hooks/useOracleSynced';
import { useTimestamp } from 'hooks/useTimestamp';
import { AuctionType, currentPrice } from 'lib/auctions';
import { formatBigNum } from 'lib/numberFormat';
import {
  getOraclePayloadFromReservoirObject,
  OraclePriceType,
} from 'lib/oracle/reservoir';
import { useMemo, useState } from 'react';
import { INFTEDA } from 'types/generated/abis/PaprController';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';

import styles from './AuctionApproveAndBuy.module.css';

type AuctionApproveAndBuyProps = {
  auction: AuctionType;
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
            tokenApproved={paprTokenApproved}
            refresh={refresh}
          />
        </div>
      </div>
    </div>
  );
}

type BuyButtonProps = {
  auction: AuctionType;
  tokenApproved: boolean;
  refresh: () => void;
};

function BuyButton({ auction, tokenApproved, refresh }: BuyButtonProps) {
  const { address } = useAccount();
  const controller = useController();
  const oracleInfo = useOracleInfo(OraclePriceType.twap);
  const oracleSynced = useOracleSynced(
    auction.auctionAssetContract.id,
    OraclePriceType.twap,
  );
  const blockTimestamp = useTimestamp();

  // ensure that the price we pass into the contract write is the most accurate maxPrice using the current block timestamp
  const auctionPriceFromBlockTimestamp = useMemo(() => {
    if (!blockTimestamp) return null;
    return currentPrice(auction, blockTimestamp.timestamp);
  }, [blockTimestamp, auction]);

  const purchaseArgs = useMemo(() => {
    if (!oracleInfo || !address || !auctionPriceFromBlockTimestamp) return null;
    const auctionArg: INFTEDA.AuctionStruct = {
      auctionAssetContract: auction.auctionAssetContract.id,
      auctionAssetID: auction.auctionAssetID,
      nftOwner: auction.vault.account,
      paymentAsset: auction.paymentAsset.id,
      perPeriodDecayPercentWad: auction.perPeriodDecayPercentWad,
      secondsInPeriod: auction.secondsInPeriod,
      startPrice: auction.startPrice,
    };
    const maxPrice = auctionPriceFromBlockTimestamp;
    const sendTo = address;
    const oracleDetails = oracleInfo[auction.auctionAssetContract.id];
    const oracleInfoStruct = getOraclePayloadFromReservoirObject(oracleDetails);

    return { auctionArg, maxPrice, sendTo, oracleInfoStruct };
  }, [auction, auctionPriceFromBlockTimestamp, address, oracleInfo]);
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
  });

  const { data, write, error } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      data.wait().then(refresh);
    },
  } as any);

  const buttonText = useMemo(() => {
    if (!oracleSynced || !blockTimestamp) return 'Waiting for oracle...';
    return 'Purchase';
  }, [oracleSynced, blockTimestamp]);

  const buttonDisabled = useMemo(() => {
    return !tokenApproved || !oracleSynced;
  }, [tokenApproved, oracleSynced]);

  return (
    <TransactionButton
      kind="regular"
      size="small"
      theme="papr"
      disabled={buttonDisabled}
      onClick={write!}
      transactionData={data}
      text={buttonText}
      error={error?.message}
    />
  );
}
