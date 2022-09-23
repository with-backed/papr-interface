import { TestPageContent } from 'components/Strategy/TestPageContent';
import { GetServerSideProps } from 'next';

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
  return <TestPageContent strategyAddress={strategyAddress} />;
}
