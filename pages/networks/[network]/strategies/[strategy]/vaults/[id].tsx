import { TransactionButton } from 'components/Button';
import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { useConfig } from 'hooks/useConfig';
import { configs, SupportedNetwork } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import {
  fetchSubgraphData,
  makeLendingStrategy,
  SubgraphPool,
  SubgraphStrategy,
} from 'lib/LendingStrategy';
import { getVaultInfo, Vault } from 'lib/strategies/vaults';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { VaultByIdDocument } from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import { useAccount, useSigner } from 'wagmi';
import styles from '../strategy.module.css';

type ServerSideProps = {
  vaultId: string;
  subgraphStrategy: SubgraphStrategy;
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

  return {
    props: {
      vaultId: id,
      subgraphStrategy: lendingStrategy,
      subgraphPool: pool,
    },
  };
};

export default function VaultPage({
  vaultId,
  subgraphPool,
  subgraphStrategy,
}: ServerSideProps) {
  const [vaultInfo, setVaultInfo] = useState<Vault | null>(null);
  const config = useConfig();
  const { data: signer } = useSigner();

  const lendingStrategy = useMemo(() => {
    return makeLendingStrategy(subgraphStrategy, subgraphPool, signer!, config);
  }, [config, signer, subgraphPool, subgraphStrategy]);
  const { replace } = useRouter();
  const [{ data }] = useQuery({
    query: VaultByIdDocument,
    variables: { id: vaultId },
  });

  const jsonRpcProvider = useMemo(() => {
    return makeProvider(
      config.jsonRpcProvider,
      config.network as SupportedNetwork,
    );
  }, [config]);

  const { address } = useAccount();

  const userIsOwner = useMemo(
    () => data?.vault?.id.toLowerCase() === address?.toLowerCase(),
    [address, data],
  );

  const fetchVaultInfo = useCallback(async () => {
    const i = await getVaultInfo(
      ethers.BigNumber.from(vaultId),
      lendingStrategy,
      signer || jsonRpcProvider,
    );
    setVaultInfo(i);
  }, [jsonRpcProvider, lendingStrategy, signer, vaultId]);

  useEffect(() => {
    fetchVaultInfo();
  }, [fetchVaultInfo]);

  const debtPrice = useAsyncValue(async () => {
    const pool = await lendingStrategy.pool();
    return lendingStrategy.token0IsUnderlying
      ? await pool.token1Price.toFixed(4)
      : await pool.token0Price.toFixed(4);
  }, [lendingStrategy]);

  const collateralVaulation = useMemo(() => {
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

  const [repayHash, setRepayHash] = useState('');
  const [repayPending, setRepayPending] = useState(false);
  const repayDebt = useCallback(async () => {
    if (vaultInfo) {
      const tx = await lendingStrategy.reduceDebt(
        ethers.BigNumber.from(vaultId).toHexString(),
        vaultInfo.debt,
      );
      setRepayHash(tx.hash);
      setRepayPending(true);

      await tx.wait();
      setRepayPending(false);
      fetchVaultInfo();
    } else {
      console.error('No vault info, cannot reduce debt');
    }
  }, [fetchVaultInfo, lendingStrategy, vaultId, vaultInfo]);

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
            <p>collateral valuation {collateralVaulation}</p>
            {/* Should fetch */}
            <p>max LTV: {maxLTVPercent}%</p>
            <p>
              current LTV:{' '}
              {((parseFloat(debtPrice || '0') * parseFloat(debtAmount)) /
                parseFloat(collateralVaulation)) *
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
              txHash={repayHash}
              isPending={repayPending}
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
