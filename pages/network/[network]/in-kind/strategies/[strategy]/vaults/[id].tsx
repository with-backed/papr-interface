import { TransactionButton } from 'components/Button';
import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { SupportedNetwork } from 'lib/config';
import { makeProvider } from 'lib/contracts';
import { getVaultInfo, Vault } from 'lib/strategies/vaults';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { VaultByIdDocument } from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import { useAccount, useSigner } from 'wagmi';
import styles from '../strategy.module.css';

export type VaultPageProps = {
  strategy: string;
  id: string;
};

export const getServerSideProps: GetServerSideProps<VaultPageProps> = async (
  context,
) => {
  const strategy = context.params?.strategy as string;
  const id = context.params?.id as string;

  return {
    props: {
      id: id,
      strategy: strategy,
    },
  };
};

export default function VaultPage({ id, strategy }: VaultPageProps) {
  const [vaultInfo, setVaultInfo] = useState<Vault | null>(null);
  const config = useConfig();
  const { data: signer } = useSigner();
  const { replace } = useRouter();
  const [{ data }] = useQuery({
    query: VaultByIdDocument,
    variables: { id },
  });

  const jsonRpcProvider = useMemo(() => {
    return makeProvider(
      config.jsonRpcProvider,
      config.network as SupportedNetwork,
    );
  }, [config]);

  const { address } = useAccount();

  const userIsOwner = useMemo(
    () => data?.vault?.owner.id.toLowerCase() === address?.toLowerCase(),
    [address, data],
  );

  const fetchVaultInfo = useCallback(async () => {
    const i = await getVaultInfo(
      ethers.BigNumber.from(id),
      strategy,
      config,
      signer || jsonRpcProvider,
    );
    setVaultInfo(i);
  }, [config, id, jsonRpcProvider, signer, strategy]);

  useEffect(() => {
    fetchVaultInfo();
  }, [fetchVaultInfo]);

  const debtPrice = useMemo(() => {
    if (vaultInfo == null) {
      return '';
    }
    return vaultInfo.strategy.token0IsUnderlying
      ? vaultInfo.strategy.pool.token1Price.toFixed()
      : vaultInfo.strategy.pool.token0Price.toFixed();
  }, [vaultInfo]);

  const collateralVaulation = useMemo(() => {
    if (vaultInfo == null) {
      return '';
    }
    return ethers.utils.formatUnits(vaultInfo.price, 18);
  }, [vaultInfo]);

  const maxLTVPercent = useMemo(() => {
    if (vaultInfo == null) {
      return '';
    }
    return vaultInfo.strategy.maxLTVPercent;
  }, [vaultInfo]);

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
      const tx = await vaultInfo.strategy.contract.reduceDebt(
        ethers.BigNumber.from(id).toHexString(),
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
  }, [id, fetchVaultInfo, vaultInfo]);

  const [closeHash, setCloseHash] = useState('');
  const [closePending, setClosePending] = useState(false);
  const closeVault = useCallback(async () => {
    if (vaultInfo && data?.vault) {
      // TODO, get nonce for vault
      const tx = await vaultInfo.strategy.contract.closeVault(id, 0);

      setCloseHash(tx.hash);
      setClosePending(true);

      await tx.wait();
      setClosePending(false);
      replace(`/network/${config.network}/in-kind/strategies/${strategy}`);
    } else {
      console.error('No vault info, cannot close vault');
    }
  }, [config.network, data?.vault, id, replace, strategy, vaultInfo]);

  return (
    <div className={styles.column}>
      <a href={`/network/${config.network}/in-kind/strategies/${strategy}`}>
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
              {((parseFloat(debtPrice) * parseFloat(debtAmount)) /
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
              {vaultInfo.strategy.underlying.symbol}
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
            <TransactionButton
              text="Close Vault"
              onClick={closeVault}
              txHash={closeHash}
              isPending={closePending}
              disabled={!userIsOwner || vaultInfo.debt.gt(0)}
            />
          </Fieldset>
        </>
      )}
    </div>
  );
}
