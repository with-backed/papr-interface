import { TestPageContent } from 'components/Strategy/TestPageContent';
import { useConfig } from 'hooks/useConfig';
import { LendingStrategy, populateLendingStrategy } from 'lib/strategies';
import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useState } from 'react';

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

  return <TestPageContent strategyAddress={strategyAddress} />;
}
