import { SendTransactionResult } from '@wagmi/core';
import { Fieldset } from 'components/Fieldset';
import { configs } from 'lib/config';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import styles from './HeroesLandingPageContent.module.css';
import { ERC721__factory } from 'types/generated/abis';
import { useCallback, useMemo, useState } from 'react';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { CenterAsset } from 'components/CenterAsset';
import { PHUSDC__factory } from 'types/generated/abis/factories/PHUSDC__factory';
import { ethers } from 'ethers';
import Link from 'next/link';
import { Table } from 'components/Table';
import { getAddress } from 'ethers/lib/utils';
import { HeroPlayerBalance } from 'lib/paprHeroes';
import { addressToENS } from 'lib/account';
import { useConfig } from 'hooks/useConfig';
import { HeroClaim__factory } from 'types/generated/abis/factories/HeroClaim__factory';
import airdropInput from 'lib/heroClaims/airdropInput.json';
import airdropOutput from 'lib/heroClaims/airdropOutput.json';
import { TransactionButton } from 'components/Button';

type HeroesLandingPageContentProps = {
  collateral: string[];
  oracleInfo: { [key: string]: ReservoirResponseData };
  rankedPlayers: [string, HeroPlayerBalance][];
};

const longestString = (arr: string[]) => {
  return arr.reduce((a, b) => (a.length > b.length ? a : b), '');
};

export function HeroesLandingPageContent({
  collateral,
  oracleInfo,
  rankedPlayers,
}: HeroesLandingPageContentProps) {
  const { address } = useAccount();

  const connectedRankedPlayer = useMemo(() => {
    if (!address) {
      return null;
    }
    return rankedPlayers.find(
      ([p, _balance]) => getAddress(p) === getAddress(address),
    );
  }, [address, rankedPlayers]);

  const longestNFTValue = useMemo(() => {
    return longestString(
      rankedPlayers.map(([_player, balance]) =>
        balance.totalNFTWorth.toFixed(2).toString(),
      ),
    );
  }, [rankedPlayers]);

  const longestPhUSDCBalance = useMemo(() => {
    return longestString(
      rankedPlayers.map(([_player, balance]) =>
        balance.totalPhUSDCBalance.toFixed(2).toString(),
      ),
    );
  }, [rankedPlayers]);

  const longestTotalBalance = useMemo(() => {
    return longestString(
      rankedPlayers.map(([_player, balance]) =>
        balance.totalBalance.toFixed(2).toString(),
      ),
    );
  }, [rankedPlayers]);

  const longestNetPapr = useMemo(() => {
    return longestString(
      rankedPlayers.map(([_player, balance]) =>
        balance.netPapr.toFixed(2).toString(),
      ),
    );
  }, [rankedPlayers]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.fieldsetsWrapper}>
        <Fieldset legend="🧮 join the game">
          <p>
            Papr Hero is a PvP competition where players compete to see who can
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
            At the end of the competition, a user&apos;s final <i>phUSDC</i>{' '}
            score is the sum of their <i>phUSDC</i> balance as well as the value
            of their NFTs (as calculated by the floor price of the collection)
          </p>
          <Claim />
        </Fieldset>

        <Fieldset legend="leaderboard">
          <div className={styles.leaderboard}>
            <Table className={`${styles.table} ${styles.leaderboardTable}`}>
              <thead>
                <tr>
                  <th></th>
                  <th>
                    <p>
                      NFT
                      <br />
                      value
                    </p>
                  </th>
                  <th>
                    <p>phUSDC</p>
                  </th>
                  <th>
                    <p>
                      paprHERO (net)
                      <br />
                      (in phUSDC)
                    </p>
                  </th>
                  <th>
                    <p>
                      Total
                      <br />
                      (phUSDC)
                    </p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rankedPlayers.map(([player, balance], i) => (
                  <LeaderboardEntry
                    key={player}
                    address={player}
                    heroPlayerBalance={balance}
                    position={i + 1}
                    longestBalanceStrings={{
                      totalBalance: longestTotalBalance,
                      totalNFTWorth: longestNFTValue,
                      totalPhUSDCBalance: longestPhUSDCBalance,
                      netPapr: longestNetPapr,
                    }}
                  />
                ))}
                {!!connectedRankedPlayer && (
                  <>
                    <tr></tr>
                    <LeaderboardEntry
                      key={address}
                      address={'You'}
                      heroPlayerBalance={connectedRankedPlayer[1]}
                      position={
                        rankedPlayers.findIndex(
                          ([p, _balance]) =>
                            getAddress(p) === getAddress(address!),
                        ) + 1
                      }
                      longestBalanceStrings={{
                        totalBalance: longestTotalBalance,
                        totalNFTWorth: longestNFTValue,
                        totalPhUSDCBalance: longestPhUSDCBalance,
                        netPapr: longestNetPapr,
                      }}
                    />
                  </>
                )}
              </tbody>
            </Table>
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
      configs.paprHero.paprUnderlyingAddress,
      signerOrProvider,
    );
  }, [signerOrProvider]);

  const currentBalance = useAsyncValue(
    () => (address ? erc20.balanceOf(address) : (async () => null)()),
    [erc20, address],
  );
  const stakeInfo = useAsyncValue(
    () => (address ? erc20.stakeInfo(address) : (async () => null)()),
    [erc20, address],
  );
  const totalWithInterest = useAsyncValue(
    () =>
      stakeInfo
        ? erc20.stakedBalance({
            amount: stakeInfo[0],
            depositedAt: stakeInfo[1],
          })
        : (async () => null)(),
    [stakeInfo, erc20],
  );

  const decimals = useAsyncValue(() => erc20.decimals(), [erc20]);

  const amountToStake = useMemo(() => {
    if (!value || !stakeInfo || !decimals) return null;
    const valueBigNumber = ethers.utils.parseUnits(value, decimals);
    if (valueBigNumber.lte(stakeInfo[0])) return null;

    return valueBigNumber.sub(stakeInfo[0]);
  }, [value, stakeInfo, decimals]);

  const { config: stakeConfig } = usePrepareContractWrite({
    address: configs.paprHero.paprUnderlyingAddress,
    abi: PHUSDC__factory.abi,
    functionName: 'stake',
    args: [amountToStake],
    overrides: {
      gasLimit: ethers.BigNumber.from(ethers.utils.hexValue(3000000)),
    },
  });

  const { data: stakeData, write: stake } = useContractWrite({
    ...stakeConfig,
    onSuccess: (data: any) => {
      data.wait().then(() => window.location.reload());
    },
  } as any);

  const { config: withdrawConfig } = usePrepareContractWrite({
    address: configs.paprHero.paprUnderlyingAddress,
    abi: PHUSDC__factory.abi,
    functionName: 'unstake',
    args: [],
    overrides: {
      gasLimit: ethers.BigNumber.from(ethers.utils.hexValue(3000000)),
    },
  });

  const { data: withdrawData, write: withdraw } = useContractWrite({
    ...withdrawConfig,
    onSuccess: (data: any) => {
      data.wait().then(() => window.location.reload());
    },
  } as any);

  if (!decimals) return <></>;

  return (
    <Fieldset legend="🪙 phUSDC">
      {!!address && (
        <Table className={`${styles.table} ${styles.phUSDCTable}`}>
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
              <th className={styles.interestEarned}></th>
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
                <input
                  value={
                    !!value
                      ? value
                      : !!stakeInfo
                      ? ethers.utils.formatUnits(stakeInfo[0], decimals)
                      : 0
                  }
                  onChange={(e) => setValue(e.target.value)}></input>
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
                <button
                  className={styles.button}
                  onClick={stake! as () => void}>
                  Stake{' '}
                  {amountToStake &&
                    ethers.utils.formatUnits(amountToStake, decimals)}
                </button>
                <button
                  className={styles.button}
                  onClick={withdraw! as () => void}>
                  Withdraw all
                </button>
              </td>
            </tr>
          </tbody>
        </Table>
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
    () => (address ? erc721.balanceOf(address) : (async () => null)()),
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
      <Table className={`${styles.table} ${styles.allowedCollateralTable}`}>
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
                href={`${configs.paprHero.reservoirMarketplace}/collections/${contractAddress}`}
                passHref={true}>
                <button className={styles.button}>Buy or Sell</button>
              </Link>
            </td>
          </tr>
        </tbody>
      </Table>
    </Fieldset>
  );
}

type LeaderboardEntryProps = {
  address: string | 'You';
  position: number;
  heroPlayerBalance: HeroPlayerBalance;
  longestBalanceStrings: {
    totalNFTWorth: string;
    totalPhUSDCBalance: string;
    netPapr: string;
    totalBalance: string;
  };
};

function shortenAddress(address: string) {
  if (address.length < 9) {
    return address;
  } else {
    return address.substring(0, 8);
  }
}

function LeaderboardEntry({
  address,
  position,
  heroPlayerBalance,
  longestBalanceStrings,
}: LeaderboardEntryProps) {
  const { jsonRpcProvider } = useConfig();
  const ensOrAddress = useAsyncValue(async () => {
    if (address === 'You') return address;

    const ens = await addressToENS(address, jsonRpcProvider);
    if (!ens) return shortenAddress(address);
    else return shortenAddress(ens);
  }, [address, jsonRpcProvider]);

  const whiteSpaceForColumn = useCallback(
    (
      k: 'totalBalance' | 'totalPhUSDCBalance' | 'totalNFTWorth' | 'netPapr',
    ) => {
      if (
        heroPlayerBalance[k].toFixed(2).toString().length >=
        longestBalanceStrings[k].length
      ) {
        return '';
      }
      return ' '.repeat(
        longestBalanceStrings[k].length -
          heroPlayerBalance[k].toFixed(2).toString().length,
      );
    },
    [heroPlayerBalance, longestBalanceStrings],
  );

  return (
    <tr>
      <td>
        <p>
          {position}. <span>{ensOrAddress}</span>
          {address !== 'You' ? <span>...</span> : ''}
        </p>
      </td>
      <td className={styles.green}>
        <p>
          {whiteSpaceForColumn('totalNFTWorth')}
          {heroPlayerBalance.totalNFTWorth.toFixed(2)}
        </p>
      </td>
      <td className={styles.green}>
        <p>
          {whiteSpaceForColumn('totalPhUSDCBalance')}
          {heroPlayerBalance.totalPhUSDCBalance.toFixed(2)}
        </p>
      </td>
      <td
        className={`${
          heroPlayerBalance.netPapr >= 0 ? styles.green : styles.red
        }`}>
        <p>
          {whiteSpaceForColumn('netPapr')}
          {heroPlayerBalance.netPapr.toFixed(2)}
        </p>
      </td>
      <td>
        <p>
          {whiteSpaceForColumn('totalBalance')}
          {heroPlayerBalance.totalBalance.toFixed(2)}
        </p>
      </td>
    </tr>
  );
}

function Claim() {
  const { address } = useAccount();
  const signerOrProvider = useSignerOrProvider();
  const [tx, setTx] = useState<SendTransactionResult | undefined>(undefined);

  const connectedClaimsContract = useMemo(
    () =>
      HeroClaim__factory.connect(
        process.env.NEXT_PUBLIC_HERO_CLAIM_CONTRACT!,
        signerOrProvider,
      ),
    [signerOrProvider],
  );

  const claimInputForAccount = useMemo(() => {
    if (!address) return null;
    return airdropInput.data.find(
      (d) => getAddress(d.account) === getAddress(address),
    );
  }, [address]);

  const claimOutputForAccount = useMemo(() => {
    if (!address) return null;
    const proofAddress = Object.keys(airdropOutput.proofs).find(
      (addr) => getAddress(addr) === getAddress(address),
    );
    if (!proofAddress) return null;
    return (airdropOutput.proofs as { [key: string]: string[] })[proofAddress];
  }, [address]);

  const userEligibleForAirdrop = useMemo(
    () =>
      !address
        ? false
        : Object.keys(airdropOutput.proofs)
            .map((addr) => getAddress(addr))
            .includes(getAddress(address)),
    [address],
  );

  const alreadyClaimed = useAsyncValue(async () => {
    if (!address) return null;
    return connectedClaimsContract.claimed(address);
  }, [address, connectedClaimsContract]);

  const claim = useCallback(async () => {
    if (!address) return;
    if (!claimInputForAccount || !claimOutputForAccount) return;
    const { blitCount, dinoCount, moonBirdCount, toadzCount, phUSDCAmount } =
      claimInputForAccount.claim;

    const t = await connectedClaimsContract.claim(
      {
        account: address!,
        claim: {
          blitCount,
          dinoCount,
          moonBirdCount,
          toadzCount,
          phUSDCAmount: ethers.utils.parseUnits(phUSDCAmount.toString(), 6),
        },
      },
      claimOutputForAccount,
      {
        gasLimit: ethers.BigNumber.from(ethers.utils.hexValue(3000000)),
      },
    );
    setTx({
      hash: t.hash as `0x${string}`,
      wait: t.wait,
    });
  }, [
    address,
    claimInputForAccount,
    claimOutputForAccount,
    connectedClaimsContract,
  ]);

  if (!address)
    return (
      <div>
        <p>Connect your wallet to check eligilbility and claim your assets</p>
      </div>
    );

  if (alreadyClaimed === null)
    return (
      <div>
        <p>Loading claim info...</p>
      </div>
    );

  if (alreadyClaimed === true) return <></>;

  if (!userEligibleForAirdrop)
    return (
      <div>
        <p>Oops! Looks like you are not eligible to participate in paprHero</p>
      </div>
    );

  return (
    <div>
      <p>
        You are eligible for the following airdrop claim to participate in
        paprHero:
      </p>
      <ol>
        <li>{claimInputForAccount?.claim.blitCount} Blitmaps</li>
        <li>{claimInputForAccount?.claim.dinoCount} Dinos</li>
        <li>{claimInputForAccount?.claim.moonBirdCount} Moonbirds</li>
        <li>{claimInputForAccount?.claim.toadzCount} Toadz</li>
        <li>{claimInputForAccount?.claim.phUSDCAmount} phUSDC</li>
      </ol>
      <TransactionButton text="Claim" onClick={claim} transactionData={tx} />
    </div>
  );
}
