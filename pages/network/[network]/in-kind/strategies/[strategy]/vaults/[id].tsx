import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { ONE } from 'lib/strategies/constants';
import { getVaultInfo, Vault } from 'lib/strategies/vaults';
import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

  const fetchVaultInfo = useCallback(async () => {
    const i = await getVaultInfo(ethers.BigNumber.from(id), strategy, config);
    setVaultInfo(i);
  }, [id, strategy]);

  useEffect(() => {
    fetchVaultInfo();
  }, [id, strategy]);

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
    return vaultInfo.strategy.maxLTV.div(ONE.div(100)).toNumber();
  }, [vaultInfo]);

  const debtAmount = useMemo(() => {
    if (vaultInfo == null) {
      return '';
    }
    return ethers.utils.formatUnits(vaultInfo.debt, 18);
  }, [vaultInfo]);

  return (
    <div>
      <a href={`/network/${config.network}/in-kind/strategies/${strategy}`}>
        {' '}
        ⬅ strategy{' '}
      </a>
      {vaultInfo == null ? (
        ''
      ) : (
        <fieldset>
          <legend>Vault Info</legend>
          <p>owner: {vaultInfo.owner}</p>
          <p>debt: {debtAmount}</p>
          {/* TODO should fetch underlying decimals */}
          <p>collateral valuation {collateralVaulation}</p>
          {/* Should fetch */}
          <p>max LTV: {maxLTVPercent}%</p>
          <p>
            {' '}
            current LTV:{' '}
            {((parseFloat(debtPrice) * parseFloat(debtAmount)) /
              parseFloat(collateralVaulation)) *
              100}
            %
          </p>
          <p>
            liquidation price: when 1 DT ={' '}
            {vaultInfo.liquidationPrice.toString()} underlying
          </p>
          <p>
            {' '}
            current debt token price: {debtPrice}{' '}
            {vaultInfo.strategy.underlying.symbol}
          </p>
          <p>
            Strategy&apos;s Current APR:{' '}
            {parseFloat(vaultInfo.strategy.currentAPRBIPs.toString()) / 100}%
          </p>
        </fieldset>
      )}
    </div>
  );
}
