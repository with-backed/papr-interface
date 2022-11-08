import { Fieldset } from 'components/Fieldset';
import { configs } from 'lib/config';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import styles from './HeroesLandingPageContent.module.css';
import { ERC721__factory } from 'types/generated/abis';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useAccount } from 'wagmi';
import { CenterAsset } from 'components/CenterAsset';
import { PHUSDC__factory } from 'types/generated/abis/factories/PHUSDC__factory';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import Link from 'next/link';

type HeroesLandingPageContentProps = {
  collateral: string[];
  oracleInfo: { [key: string]: ReservoirResponseData };
  rankedPlayers: string[][];
};

export function HeroesLandingPageContent({
  collateral,
  oracleInfo,
  rankedPlayers,
}: HeroesLandingPageContentProps) {
  const { address } = useAccount();

  return (
    <div className={styles.wrapper}>
      <div className={styles.fieldsetsWrapper}>
        <Fieldset legend="what is papr heroes">
          <p>
            Papr Hero is a PVP competition where players compete to see who can
            end up with the most <i>phUSDC</i>. Every player starts with a fixed
            amount of <i>phUSDC</i> and eligible NFTs. Players can perform one
            or more of the following actions to increase their <i>phUSDC</i>{' '}
            balance:
            <ol>
              <li>
                Lock NFTs as collateral and borrow <i>phUSDC</i>
              </li>
              <li>
                Stake <i>phUSDC</i> for 10% APR
              </li>
              <li>
                Sell their NFTs for <i>phUSDC</i>
              </li>
              <li>
                Buy NFTs with their <i>phUSDC</i>
              </li>
            </ol>
            At the end of the competition, a users final <i>phUSDC</i> score is
            the sum of their <i>phUSDC</i> balance as well as the value of their
            NFTs (as calculated by the floor price of the collection)
          </p>
        </Fieldset>
        <Fieldset legend="leaderboard">
          {rankedPlayers.map((p, i) => (
            <LeaderboardEntry
              address={p[0]}
              worth={p[1]}
              position={i + 1}
              key={p[0]}
            />
          ))}
          <div className={styles.userWalletValue}>
            <p>
              Your wallet value...............$
              {rankedPlayers.find((p) => p[0] === address)?.[1]} phUSDC
            </p>
          </div>
        </Fieldset>
        <PHUSDC />
        {collateral.map((c) => (
          <AllowedCollateral
            contractAddress={c}
            floorPrice={oracleInfo[getAddress(c)].price}
            key={c}
          />
        ))}
      </div>
    </div>
  );
}

function PHUSDC() {
  const signerOrProvider = useSignerOrProvider();
  const { address } = useAccount();
  const [value, setValue] = useState<string>('');

  const erc20 = useMemo(() => {
    return PHUSDC__factory.connect(
      configs.goerli.paprHeroesUSDC,
      signerOrProvider,
    );
  }, [signerOrProvider]);

  const currentBalance = useAsyncValue(
    () => erc20.balanceOf(address!),
    [erc20, address],
  );
  const stakeInfo = useAsyncValue(
    () => erc20.stakeInfo(address!),
    [erc20, address],
  );
  const totalWithInterest = useAsyncValue(
    () =>
      erc20.stakedBalance({
        amount: stakeInfo?.[0] || 0,
        depositedAt: stakeInfo?.[1] || 0,
      }),
    [stakeInfo, erc20],
  );

  const decimals = useAsyncValue(() => erc20.decimals(), [erc20]);

  const stake = useCallback(async () => {
    if (!decimals) return;

    await erc20.stake(ethers.utils.parseUnits(value, decimals), {
      gasLimit: ethers.BigNumber.from(ethers.utils.hexValue(3000000)),
    });
  }, [erc20, value, decimals]);

  if (!decimals) return <></>;

  return (
    <Fieldset legend="🪙 phUSDC">
      {!!address && (
        <table className={`${styles.table} ${styles.phUSDCTable}`}>
          <thead>
            <tr>
              <th className={styles.yourBalance}>
                <p>Your balance</p>
              </th>
              <th className={styles.stakedAmount}>
                <p>Staked amount</p>
              </th>
              <th className={styles.interestEarned}>
                <p>Interest earned</p>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <p>
                  {!!currentBalance
                    ? ethers.utils.formatUnits(currentBalance, decimals)
                    : 'N/A'}
                </p>
              </td>
              <td>
                <p>
                  {!!stakeInfo
                    ? ethers.utils.formatUnits(stakeInfo[0], decimals)
                    : 'N/A'}
                </p>
              </td>
              <td>
                <p>
                  {!!totalWithInterest && !!stakeInfo
                    ? ethers.utils.formatUnits(
                        totalWithInterest.sub(stakeInfo[0]),
                        decimals,
                      )
                    : 'N/A'}
                </p>
              </td>
              <td className={styles.buyOrSell}>
                <button className={styles.button}>Stake</button>
                <button className={styles.button}>Withdraw</button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
      {!address && <p>Connect wallet to see phUSDC info</p>}
    </Fieldset>
  );
}

type AllowedCollateralProps = {
  contractAddress: string;
  floorPrice: number;
};

function AllowedCollateral({
  contractAddress,
  floorPrice,
}: AllowedCollateralProps) {
  const signerOrProvider = useSignerOrProvider();
  const { address } = useAccount();

  const erc721 = useMemo(() => {
    return ERC721__factory.connect(contractAddress, signerOrProvider);
  }, [contractAddress, signerOrProvider]);

  const name = useAsyncValue(() => erc721.name(), [erc721]);
  const currentBalance = useAsyncValue(
    () => erc721.balanceOf(address!),
    [erc721, address],
  );

  return (
    <Fieldset
      legend={
        <div className={styles.legendNFT}>
          <CenterAsset address={contractAddress} tokenId={1} />
          <p>Testnet {name}</p>
        </div>
      }>
      <table className={`${styles.table} ${styles.allowedCollateralTable}`}>
        <thead>
          <tr>
            <th className={styles.yourBalance}>
              <p>Your balance</p>
            </th>
            <th>
              <p>Floor price</p>
            </th>
            <th>
              <p>Reservoir Marketplace</p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <p>{currentBalance?.toString()}</p>
            </td>
            <td>
              <p>{floorPrice} phUSDC</p>
            </td>
            <td>
              <Link
                href={`${configs.goerli.reservoirMarketplace}/collections/${contractAddress}`}
                passHref={true}>
                <button className={styles.button}>Buy or Sell</button>
              </Link>
            </td>
          </tr>
        </tbody>
      </table>
    </Fieldset>
  );
}

type LeaderboardEntryProps = {
  address: string;
  worth: string;
  position: number;
};

function LeaderboardEntry({ address, worth, position }: LeaderboardEntryProps) {
  return (
    <p>
      {position}. {address.substring(0, 10)}....................${worth} phUSDC
    </p>
  );
}
