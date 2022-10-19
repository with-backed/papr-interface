import { TransactionButton } from 'components/Button';
import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { configs, SupportedNetwork } from 'lib/config';
import {
  fetchSubgraphData,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { ReservoirResponseData } from 'lib/oracle/reservoir';
import { getOracleInfoFromAllowedCollateral } from 'lib/strategies';
import { getVaultInfo, Vault } from 'lib/strategies/vaults';
import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { VaultByIdDocument } from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import styles from '../strategy.module.css';
import { useSignerOrProvider } from 'hooks/useSignerOrProvider';
import { useLendingStrategy } from 'hooks/useLendingStrategy';
import StrategyABI from 'abis/Strategy.json';

type ServerSideProps = {
  vaultId: string;
  subgraphStrategy: SubgraphStrategy;
  oracleInfo: { [key: string]: ReservoirResponseData };
  subgraphPool: SubgraphPool;
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context,
) => {
  const address = (context.params?.strategy as string).toLowerCase();
  const network = context.params?.network as SupportedNetwork;
  const id = context.params?.id as string;

  const strategySubgraphData = await fetchSubgraphData(
    address,
    configs[network].uniswapSubgraph,
  );

  if (!strategySubgraphData) {
    return {
      notFound: true,
    };
  }

  const { pool, lendingStrategy } = strategySubgraphData;
  const oracleInfo = await getOracleInfoFromAllowedCollateral(
    lendingStrategy.allowedCollateral.map((ac) => ac.contractAddress),
    network,
  );

  return {
    props: {
      vaultId: id,
      subgraphStrategy: lendingStrategy,
      oracleInfo,
      subgraphPool: pool,
    },
  };
};

export default function VaultPage({
  vaultId,
  subgraphPool,
  oracleInfo,
  subgraphStrategy,
}: ServerSideProps) {
  const [vaultInfo, setVaultInfo] = useState<Vault | null>(null);
  const config = useConfig();
  const signerOrProvider = useSignerOrProvider();

  const lendingStrategy = useLendingStrategy({
    subgraphStrategy,
    subgraphPool,
    oracleInfo,
  });

  const [{ data }] = useQuery({
    query: VaultByIdDocument,
    variables: { id: vaultId },
  });

  const { address } = useAccount();

  const userIsOwner = useMemo(
    () => data?.vault?.id.toLowerCase() === address?.toLowerCase(),
    [address, data],
  );

  const fetchVaultInfo = useCallback(async () => {
    const i = await getVaultInfo(
      ethers.BigNumber.from(vaultId),
      lendingStrategy,
      signerOrProvider,
    );
    setVaultInfo(i);
  }, [lendingStrategy, signerOrProvider, vaultId]);

  useEffect(() => {
    fetchVaultInfo();
  }, [fetchVaultInfo]);

  const debtPrice = useAsyncValue(async () => {
    const pool = await lendingStrategy.pool();
    return lendingStrategy.token0IsUnderlying
      ? pool.token1Price.toFixed(4)
      : pool.token0Price.toFixed(4);
  }, [lendingStrategy]);

  const collateralValuation = useMemo(() => {
    if (vaultInfo == null) {
      return '';
    }
    return ethers.utils.formatUnits(vaultInfo.price, 18);
  }, [vaultInfo]);

  const maxLTVPercent = useAsyncValue(
    () => lendingStrategy.maxLTVPercent(),
    [lendingStrategy],
  );

  const debtAmount = useMemo(() => {
    if (vaultInfo == null) {
      return '';
    }
    return ethers.utils.formatUnits(vaultInfo.debt, 18);
  }, [vaultInfo]);

  const prepareRepay = usePrepareContractWrite({
    addressOrName: lendingStrategy.id,
    contractInterface: StrategyABI.abi,
    functionName: 'reduceDebt',
  });
  const repay = useContractWrite({
    ...prepareRepay.config,
    onSuccess: (data) => {
      data.wait().then(fetchVaultInfo);
    },
  });

  const repayDebt = useCallback(async () => {
    if (vaultInfo && repay.write) {
      repay.write();
    } else {
      console.error('No vault info, cannot reduce debt');
    }
  }, [repay, vaultInfo]);

  // TODO: use removeCollateral instead of closeVault

  return (
    <div className={styles.column}>
      <a href={`/networks/${config.network}/strategies/${lendingStrategy.id}`}>
        ⬅ strategy
      </a>
      {!!vaultInfo && (
        <>
          <Fieldset legend="ℹ️ Vault Info">
            <p>debt: {debtAmount}</p>
            {/* TODO should fetch underlying decimals */}
            <p>collateral valuation {collateralValuation}</p>
            {/* Should fetch */}
            <p>max LTV: {maxLTVPercent}%</p>
            <p>
              current LTV:{' '}
              {((parseFloat(debtPrice || '0') * parseFloat(debtAmount)) /
                parseFloat(collateralValuation)) *
                100}
              %
            </p>
            {vaultInfo.liquidationPrice === null && (
              <p>liquidation price: N/A</p>
            )}
            {!!vaultInfo.liquidationPrice && (
              <p>
                liquidation price: when 1 DT ={' '}
                {vaultInfo.liquidationPrice.toString()} underlying
              </p>
            )}
            <p>
              current debt token price: {debtPrice}{' '}
              {lendingStrategy.underlying.symbol}
            </p>
          </Fieldset>
          <Fieldset legend="🎬 Vault Actions">
            <TransactionButton
              text="Repay Debt"
              onClick={repayDebt}
              transactionData={repay.data}
              disabled={!userIsOwner || vaultInfo.debt.eq(0)}
            />
            <br />
            <br />
          </Fieldset>
        </>
      )}
    </div>
  );
}
