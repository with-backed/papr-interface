import { SendTransactionResult } from '@wagmi/core';
import { TransactionButton } from 'components/Button';
import { CenterAsset } from 'components/CenterAsset';
import controllerStyles from 'components/Controllers/Controller.module.css';
import { ShortDisplayAddress } from 'components/DisplayAddress/ShortDisplayAddress';
import { Fieldset } from 'components/Fieldset';
import { Table } from 'components/Table';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { configs } from 'lib/config';
import airdropInput from 'lib/heroClaims/airdropInput.json';
import airdropOutput from 'lib/heroClaims/airdropOutput.json';
import { formatTokenAmount } from 'lib/numberFormat';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { HeroPlayerBalance } from 'lib/paprHeroes';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { ERC721__factory } from 'types/generated/abis';
import { HeroClaim__factory } from 'types/generated/abis/factories/HeroClaim__factory';
import { PHUSDC__factory } from 'types/generated/abis/factories/PHUSDC__factory';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';

import styles from './HeroesLandingPageContent.module.css';

type HeroesLandingPageContentProps = {
  collateral: string[];
  oracleInfo: { [key: string]: ReservoirResponseData };
  rankedPlayers: [string, HeroPlayerBalance][];
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

  return (
    <div className={controllerStyles.wrapper}>
      <Fieldset legend="🧮 join the game">
        <p className={styles.join}>
          Papr Hero is a testnet PvP competition where players compete to see
          who can end up with the most Goerli phUSDC. The assets are not worth
          anything, the game is just for fun, but testnet glory is still real
          glory. Every player starts with a combination of phUSDC and eligible
          NFTs for notional net worth of 50,000 phUSDC. Players can perform one
          or more of the following actions to increase their phUSDC balance:
        </p>
        <ol>
          <li>
            Use NFTs as collateral to mint paprHERO and
            <ul>
              <li>Swap to phUSDC + stake</li>
              <li>LP in the paprHERO {`<>`} phUSDC Uniswap pool</li>
            </ul>
          </li>
          <li>Stake phUSDC for 10% APR</li>
          <li>
            Use phUSDC to purchase paprHERO and earn from possible price
            appreciation
          </li>
          <li>Trade NFTs</li>
        </ol>
        <p>
          At the end of the competition, a users final phUSDC score is the sum
          of their phUSDC balance as well as the value of their NFTs (as
          calculated by the floor price of the collection). The competition ends
          with a snapshot on Sunday the 11th at midnight GMT, though the testnet
          will continue.
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
                    paprHERO
                    <br />
                    (net)
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
              {rankedPlayers.slice(0, 10).map(([player, balance], i) => (
                <LeaderboardEntry
                  key={player}
                  address={player}
                  heroPlayerBalance={balance}
                  position={i + 1}
                />
              ))}
            </tbody>
            <tbody className={styles.you}>
              {!!connectedRankedPlayer && address && (
                <>
                  <LeaderboardEntry
                    key={address}
                    address={address}
                    heroPlayerBalance={connectedRankedPlayer[1]}
                    position={
                      rankedPlayers.findIndex(
                        ([p, _balance]) =>
                          getAddress(p) === getAddress(address!),
                      ) + 1
                    }
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
                Your
                <br />
                balance
              </th>
              <th className={styles.stakedAmount}>
                Staked
                <br />
                amount
              </th>
              <th className={styles.interestEarned}>
                Interest
                <br />
                earned
              </th>
              <th className={styles.interestEarned}></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <p>
                  {!!currentBalance
                    ? parseFloat(
                        ethers.utils.formatUnits(currentBalance, decimals),
                      ).toFixed(2)
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
                passHref={true}
                legacyBehavior>
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
  address: string;
  position: number;
  heroPlayerBalance: HeroPlayerBalance;
};

function LeaderboardEntry({
  address,
  position,
  heroPlayerBalance,
}: LeaderboardEntryProps) {
  return (
    <tr>
      <td>
        <span className={styles.position}>
          {(position.toString() + '.').padEnd(5, ' ')}
          <ShortDisplayAddress address={address} />
        </span>
      </td>
      <td className={styles.green}>
        {formatTokenAmount(heroPlayerBalance.totalNFTWorth)}
      </td>
      <td className={styles.green}>
        {formatTokenAmount(heroPlayerBalance.totalPhUSDCBalance)}
      </td>
      <td
        className={`${
          heroPlayerBalance.netPapr >= 0 ? styles.green : styles.red
        }`}>
        {formatTokenAmount(heroPlayerBalance.netPapr)}
      </td>
      <td>{formatTokenAmount(heroPlayerBalance.totalBalance)}</td>
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
