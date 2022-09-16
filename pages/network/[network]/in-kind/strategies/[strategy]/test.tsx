import MintCollateral from 'components/Strategy/MintCollateral';
import MintERC20 from 'components/Strategy/MintERC20';
import { useConfig } from 'hooks/useConfig';
import { SupportedNetwork } from 'lib/config';
import { LendingStrategy, populateLendingStrategy } from 'lib/strategies';
import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import strategyStyles from './strategy.module.css';
import styles from './test.module.css';

export type TestProps = {
  strategyAddress: string;
};

export const getServerSideProps: GetServerSideProps<TestProps> = async (
  context,
) => {
  const address = (context.params?.strategy as string).toLowerCase();

  return {
    props: {
      strategyAddress: address,
    },
  };
};

export default function InKindTest({ strategyAddress }: TestProps) {
  const config = useConfig();
  const { address } = useAccount();
  const [lendingStrategy, setLendingStrategy] =
    useState<LendingStrategy | null>(null);

  const populate = useCallback(async () => {
    const s = await populateLendingStrategy(strategyAddress, config);
    setLendingStrategy(s);
  }, [strategyAddress, config]);

  useEffect(() => {
    populate();
  }, [populate]);

  if (!lendingStrategy) return <></>;

  return (
    <div className={strategyStyles.wrapper}>
      <div className={styles.wrapper}>
        <div className={strategyStyles.column}>
          <MintERC20 token={lendingStrategy.underlying} />
          <MintCollateral token={lendingStrategy.collateral} />
        </div>
      </div>
    </div>
  );
}
