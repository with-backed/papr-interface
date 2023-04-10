import PaprControllerABI from 'abis/PaprController.json';
import { TransactionButton } from 'components/Button';
import { ApproveTokenButton } from 'components/Controllers/ApproveButtons/ApproveTokenButton';
import { ethers } from 'ethers';
import { useController } from 'hooks/useController';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useOracleSynced } from 'hooks/useOracleSynced';
import { formatBigNum } from 'lib/numberFormat';
import {
  getOraclePayloadFromReservoirObject,
  OraclePriceType,
} from 'lib/oracle/reservoir';
import { useMemo, useState } from 'react';
import { INFTEDA } from 'types/generated/abis/PaprController';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';

import styles from './AuctionApproveAndBuy.module.css';

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
  const oracleSynced = useOracleSynced(
    auction.auctionAssetContract.id,
    OraclePriceType.twap,
  );
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
    const maxPrice = liveAuctionPrice.add(ethers.BigNumber.from(100)); // small padding of 100e-18 to ensure max price is big enough
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
  });

  const { data, write, error } = useContractWrite({
    ...config,
    onSuccess: (data: any) => {
      data.wait().then(refresh);
    },
  } as any);

  const buttonText = useMemo(() => {
    if (!oracleSynced) return 'Waiting for oracle...';
    return 'Purchase';
  }, [oracleSynced]);

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
