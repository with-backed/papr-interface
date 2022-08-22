import { TransactionButton } from 'components/Button';
import { useConfig } from 'hooks/useConfig';
import { validateNetwork } from 'lib/config';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { StrategyFactory__factory } from 'types/generated/abis';
import { useSigner } from 'wagmi';

export default function Factory() {
  const { data: signer } = useSigner();

  return <div>{signer == undefined ? 'no signer' : <Connected />}</div>;
}

export const getServerSideProps: GetServerSideProps<{}> = async (context) => {
  try {
    validateNetwork(context.params!);
  } catch (e) {}

  return { props: {} };
};

function Connected() {
  const { data: signer } = useSigner();
  const [txHash, setTxHash] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { network } = useConfig();
  const { push } = useRouter();

  const create = useCallback(async () => {
    let strategy = StrategyFactory__factory.connect(
      process.env.NEXT_PUBLIC_STRATEGY_FACTORY as string,
      signer!,
    );
    const tx = await strategy.newStrategy(
      'APE Loans',
      'AP',
      process.env.NEXT_PUBLIC_MOCK_APE as string,
      process.env.NEXT_PUBLIC_MOCK_USDC as string,
    );

    const filter = strategy.filters.LendingStrategyCreated(null);
    strategy.once(filter, (address) => {
      push(`/network/${network}/in-kind/strategies/${address}`);
    });

    setTxHash(tx.hash);
    setIsPending(true);
    tx.wait()
      .then(() => {
        setIsPending(false);
      })
      .catch((reason) => console.log(reason));
  }, [network, push, signer]);

  return (
    <div>
      {/* <div>{signer}</div> */}
      <TransactionButton
        text={'Create a Strategy'}
        onClick={create}
        txHash={txHash}
        isPending={isPending}
      />
    </div>
  );
}
