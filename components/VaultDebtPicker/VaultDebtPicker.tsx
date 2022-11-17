import { Button } from 'components/Button';
import { CenterAsset } from 'components/CenterAsset';
import { VaultDebtSlider } from 'components/Controllers/OpenVault/VaultDebtSlider';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { Toggle } from 'components/Toggle';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { CenterUserNFTsResponse } from 'hooks/useCenterNFTs';
import { useConfig } from 'hooks/useConfig';
import { useOracleInfo } from 'hooks/useOracleInfo/useOracleInfo';
import { useQuoteWithSlippage } from 'hooks/useQuoteWithSlippage';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { SupportedToken } from 'lib/config';
import { Quoter } from 'lib/contracts';
import {
  deconstructFromId,
  getQuoteForSwap,
  getUniqueNFTId,
} from 'lib/controllers';
import { formatBigNum } from 'lib/numberFormat';
import { PaprController } from 'lib/PaprController';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ERC721__factory } from 'types/generated/abis';
import { VaultsByOwnerForControllerQuery } from 'types/generated/graphql/inKindSubgraph';
import { useAccount } from 'wagmi';
import styles from './VaultDebtPicker.module.css';

type VaultDebtPickerProps = {
  paprController: PaprController;
  vault: VaultsByOwnerForControllerQuery['vaults']['0'] | undefined;
  collateralContractAddress: string;
  userNFTsForVault: CenterUserNFTsResponse[];
};

function selectedArrayIncludes(
  arr: CenterUserNFTsResponse[],
  item: CenterUserNFTsResponse,
) {
  return arr.some(
    (elem) => elem.address === item.address && elem.tokenId === item.tokenId,
  );
}

export function VaultDebtPicker({
  paprController,
  vault,
  collateralContractAddress,
  userNFTsForVault,
}: VaultDebtPickerProps) {
  // init hooks
  const { jsonRpcProvider, tokenName } = useConfig();
  const signerOrProvider = useSignerOrProvider();
  const oracleInfo = useOracleInfo();
  const { address } = useAccount();

  // NFT selection variables
  const [depositNFTs, setDepositNFTs] = useState<string[]>([]);
  const [withdrawNFTs, setWithdrawNFTs] = useState<string[]>([]);

  const numCollateralForMaxDebt = useMemo(() => {
    return (
      (vault?.collateral.length || 0) + depositNFTs.length - withdrawNFTs.length
    );
  }, [vault?.collateral.length, depositNFTs, withdrawNFTs]);
  const userAndVaultNFTs = useMemo(() => {
    return userNFTsForVault
      .map((nft) => ({
        address: nft.address,
        tokenId: nft.tokenId,
        inVault: false,
      }))
      .concat(
        (vault?.collateral || []).map((c) => ({
          address: c.contractAddress,
          tokenId: c.tokenId,
          inVault: true,
        })),
      );
  }, [userNFTsForVault, vault?.collateral]);

  // debt variables

  const [chosenDebt, setChosenDebt] = useState<ethers.BigNumber>(
    ethers.BigNumber.from(vault?.debt || 0),
  );
  const loanAmountInUnderlying = useAsyncValue(async () => {
    if (chosenDebt.isZero()) return ethers.BigNumber.from(0);
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwap(
      quoter,
      chosenDebt,
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [
    jsonRpcProvider,
    tokenName,
    paprController.debtToken.id,
    paprController.underlying.id,
    chosenDebt,
  ]);

  const currentVaultDebt = useMemo(() => {
    return ethers.BigNumber.from(vault?.debt || 0);
  }, [vault]);

  const [isBorrowing, setIsBorrowing] = useState<boolean>(true);
  const [usingPerpetual, setUsingPerpetual] = useState<boolean>(false);

  const debtToBorrowOrRepay = useMemo(() => {
    if (currentVaultDebt.isZero()) return chosenDebt;
    if (chosenDebt.gt(currentVaultDebt))
      return chosenDebt.sub(currentVaultDebt);
    return currentVaultDebt.sub(chosenDebt);
  }, [chosenDebt, currentVaultDebt]);
  const underlyingToBorrowOrRepay = useAsyncValue(async () => {
    if (debtToBorrowOrRepay.isZero()) return ethers.BigNumber.from(0);
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwap(
      quoter,
      debtToBorrowOrRepay,
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [
    debtToBorrowOrRepay,
    paprController.debtToken.id,
    paprController.underlying.id,
    jsonRpcProvider,
    tokenName,
  ]);

  const connectedNFT = useMemo(() => {
    return ERC721__factory.connect(collateralContractAddress, signerOrProvider);
  }, [collateralContractAddress, signerOrProvider]);
  const nftSymbol = useAsyncValue(() => connectedNFT.symbol(), [connectedNFT]);

  const vaultHasDebt = useMemo(() => {
    if (!vault) return false;
    return !ethers.BigNumber.from(vault.debt).isZero();
  }, [vault]);

  const maxDebtPerNFTInPerpetual = useAsyncValue(async () => {
    if (!oracleInfo) return null;
    return paprController.maxDebt([userNFTsForVault[0].address], oracleInfo);
  }, [paprController, userNFTsForVault, oracleInfo]);

  const maxDebtPerNFTInUnderlying = useAsyncValue(async () => {
    if (!oracleInfo || !maxDebtPerNFTInPerpetual) return null;
    const quoter = Quoter(jsonRpcProvider, tokenName as SupportedToken);
    return getQuoteForSwap(
      quoter,
      maxDebtPerNFTInPerpetual,
      paprController.debtToken.id,
      paprController.underlying.id,
    );
  }, [
    maxDebtPerNFTInPerpetual,
    jsonRpcProvider,
    tokenName,
    paprController,
    oracleInfo,
  ]);

  const maxLTV = useAsyncValue(
    () => paprController.maxLTVPercent(),
    [paprController],
  );

  const handleChosenDebtChanged = useCallback(
    (value: string) => {
      if (!value) return;
      const debtBigNumber = ethers.utils.parseUnits(
        value,
        paprController.debtToken.decimals,
      );
      setChosenDebt(debtBigNumber);
    },
    [paprController.debtToken.decimals],
  );

  if (!oracleInfo) return <></>;

  return (
    <Fieldset legend={`💸 ${nftSymbol}`}>
      <Table className={styles.collateralTable}>
        <thead>
          <tr>
            <th></th>
            <th>
              <p>ID</p>
            </th>
            <th>
              <p>FLOOR VALUE</p>
            </th>
            <th>
              <p>MAX BORROW</p>
            </th>
            <th>
              <p>DEPOSIT</p>
            </th>
            {vaultHasDebt && (
              <th>
                <p>WITHDRAW</p>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {maxDebtPerNFTInUnderlying &&
            userAndVaultNFTs.map((nft) => (
              <CollateralRow
                key={`${nft.address}-${nft.tokenId}`}
                contractAddress={nft.address}
                tokenId={nft.tokenId}
                floorPrice={oracleInfo[getAddress(nft.address)].price}
                inVault={nft.inVault}
                vaultHasDebt={vaultHasDebt}
                maxBorrow={formatBigNum(
                  maxDebtPerNFTInUnderlying,
                  paprController.underlying.decimals,
                )}
                depositNFTs={depositNFTs}
                withdrawNFTs={withdrawNFTs}
                setDepositNFTs={setDepositNFTs}
                setWithdrawNFTs={setWithdrawNFTs}
              />
            ))}
        </tbody>
      </Table>
      <div className={styles.slider}>
        {!!maxDebtPerNFTInPerpetual && (
          <VaultDebtSlider
            controller={paprController}
            currentVaultDebt={currentVaultDebt}
            maxDebt={maxDebtPerNFTInPerpetual.mul(numCollateralForMaxDebt)}
            handleChosenDebtChanged={handleChosenDebtChanged}
            isBorrowing={true}
            maxLTV={maxLTV}
            setIsBorrowing={setIsBorrowing}
          />
        )}
      </div>
      <div className={styles.editLoanPreview}>
        <div>
          <Button size="xsmall" theme="white" kind="outline">
            Edit Loan
          </Button>
        </div>
        <div>
          <p>
            Loan Amount:{' '}
            <span>
              {!!loanAmountInUnderlying &&
                formatBigNum(
                  loanAmountInUnderlying,
                  paprController.underlying.decimals,
                )}{' '}
              USDC
            </span>
          </p>
          <p>
            {formatBigNum(chosenDebt, paprController.debtToken.decimals)}{' '}
            paprTrash
          </p>
        </div>
      </div>
      <div className={styles.editLoanForm}>
        <div>
          <Toggle
            leftText="Borrow More"
            rightText="Repay"
            checked={isBorrowing}
            onChange={() => null}
          />
        </div>
        <div>
          <Toggle
            leftText="USDC"
            rightText="papr"
            checked={!usingPerpetual}
            onChange={() => setUsingPerpetual(!usingPerpetual)}
          />
        </div>
        <div>
          {underlyingToBorrowOrRepay && (
            <input
              value={formatBigNum(
                usingPerpetual
                  ? debtToBorrowOrRepay
                  : underlyingToBorrowOrRepay,
                usingPerpetual
                  ? paprController.debtToken.decimals
                  : paprController.underlying.decimals,
              )}
              onChange={(e) => null}
            />
          )}
        </div>
      </div>
      {/* <div className={styles.slippage}>
        <p>Slippage: 5.03%</p>
      </div> */}
    </Fieldset>
  );
}

type CollateralRowProps = {
  contractAddress: string;
  tokenId: string;
  floorPrice: number;
  maxBorrow: string;
  inVault: boolean;
  vaultHasDebt: boolean;
  depositNFTs: string[];
  withdrawNFTs: string[];
  setDepositNFTs: Dispatch<SetStateAction<string[]>>;
  setWithdrawNFTs: Dispatch<SetStateAction<string[]>>;
};

function CollateralRow({
  contractAddress,
  tokenId,
  floorPrice,
  maxBorrow,
  inVault,
  vaultHasDebt,
  depositNFTs,
  withdrawNFTs,
  setDepositNFTs,
  setWithdrawNFTs,
}: CollateralRowProps) {
  const uniqueNFTId = useMemo(
    () => getUniqueNFTId(contractAddress, tokenId),
    [contractAddress, tokenId],
  );
  const checkedForDeposit = useMemo(
    () => depositNFTs.includes(uniqueNFTId),
    [uniqueNFTId, depositNFTs],
  );
  const checkedForWithdraw = useMemo(
    () => withdrawNFTs.includes(uniqueNFTId),
    [uniqueNFTId, withdrawNFTs],
  );

  const handleInputBoxChecked = useCallback(
    (checkbox: 'withdraw' | 'deposit', nftId: string) => {
      if (checkbox === 'deposit') {
        if (depositNFTs.includes(nftId))
          setDepositNFTs((prev) => prev.filter((nfts) => nfts !== nftId));
        else setDepositNFTs((prev) => [...prev, nftId]);
      } else {
        if (withdrawNFTs.includes(nftId))
          setWithdrawNFTs((prev) => prev.filter((nfts) => nfts !== nftId));
        else setWithdrawNFTs((prev) => [...prev, nftId]);
      }
    },
    [depositNFTs, withdrawNFTs, setDepositNFTs, setWithdrawNFTs],
  );

  return (
    <tr>
      <td>
        <div className={styles.thumbnail}>
          <CenterAsset address={contractAddress} tokenId={tokenId} />
        </div>
      </td>
      <td>
        <p>#{tokenId}</p>
      </td>
      <td>
        <p>${floorPrice}</p>
      </td>
      <td>
        <p>${maxBorrow}</p>
      </td>
      <td>
        <input
          type="checkbox"
          disabled={inVault}
          checked={checkedForDeposit || inVault}
          onClick={() => handleInputBoxChecked('deposit', uniqueNFTId)}
        />
      </td>
      {vaultHasDebt && (
        <td>
          <input
            type="checkbox"
            disabled={!inVault}
            checked={checkedForWithdraw}
            onClick={() => handleInputBoxChecked('withdraw', uniqueNFTId)}
          />
        </td>
      )}
    </tr>
  );
}
