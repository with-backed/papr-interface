import { Fieldset } from 'components/Fieldset';
import { configs } from 'lib/config';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import styles from './HeroesLandingPageContent.module.css';
import { ERC721__factory } from 'types/generated/abis';
import { useMemo, useState } from 'react';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { CenterAsset } from 'components/CenterAsset';
import { PHUSDC__factory } from 'types/generated/abis/factories/PHUSDC__factory';
import { ethers } from 'ethers';
import Link from 'next/link';
import { Table } from 'components/Table';
import { getAddress } from 'ethers/lib/utils';
import { HeroPlayerBalance } from 'lib/paprHeroes';

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
    <div className={styles.wrapper}>
      <div className={styles.fieldsetsWrapper}>
        <Fieldset legend="🧮 join the game">
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
};

function LeaderboardEntry({
  address,
  position,
  heroPlayerBalance: {
    totalNFTWorth,
    totalPhUSDCBalance,
    netPapr,
    totalBalance,
  },
}: LeaderboardEntryProps) {
  return (
    <tr>
      <td>
        <p>
          {position}. {address.substring(0, 7)} {address !== 'You' ? '...' : ''}
        </p>
      </td>
      <td className={styles.green}>
        <p>{totalNFTWorth.toFixed(2)}</p>
      </td>
      <td className={styles.green}>
        <p>{totalPhUSDCBalance.toFixed(2)}</p>
      </td>
      <td className={`${netPapr > 0 ? 'green' : 'red'}`}>
        <p>{netPapr.toFixed(2)}</p>
      </td>
      <td>
        <p>{totalBalance.toFixed(2)}</p>
      </td>
    </tr>
  );
}
