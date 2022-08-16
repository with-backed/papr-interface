import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { getVaultInfo, Vault } from 'lib/strategies/vaults';
import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useState } from 'react';

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

  return (
    <div>
      {vaultInfo == null ? (
        ''
      ) : (
        <fieldset>
          <legend>Vault Info</legend>
          <p>owner: {vaultInfo.owner}</p>
          <p>debt: {ethers.utils.formatUnits(vaultInfo.debt, 18)}</p>
          {/* TODO should fetch underlying decimals */}
          <p>
            collateral valuation {ethers.utils.formatUnits(vaultInfo.price, 18)}
          </p>
          {/* Should fetch */}
          <p>max LTV: 50%</p>
          <p> current LTV: </p>
          <p>
            liquidation price: when 1 DT ={' '}
            {vaultInfo.liquidationPrice.toString()} underlying
          </p>
          <p> current price: </p>
        </fieldset>
      )}
    </div>
  );
}
