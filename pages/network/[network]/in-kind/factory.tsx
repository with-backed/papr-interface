import { TransactionButton } from 'components/Button';
import { validateNetwork } from 'lib/config';
import { GetServerSideProps } from 'next';
import { Suspense, useCallback, useState } from 'react';
import { StrategyFactory__factory } from 'types/generated/abis';
import { useAccount, useSigner } from 'wagmi';

export default function Factory() {
  const { data: signer, isError, isLoading } = useSigner();

  return <div>{signer == undefined ? 'no signer' : <Connected />}</div>;
}

export const getServerSideProps: GetServerSideProps<{}> = async (context) => {
  try {
    validateNetwork(context.params!);
  } catch (e) {}

  return { props: {} };
};

function Connected() {
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const [txHash, setTxHash] = useState('');
  const [isPending, setIsPending] = useState(false);

  const create = useCallback(async () => {
    console.log(signer!);
    let strategy = StrategyFactory__factory.connect(
      process.env.NEXT_PUBLIC_STRATEGY_FACTORY as string,
      signer!,
    );
    const tx = await strategy.newStrategy(
      'A NFT Lending Strategy ',
      'USDC',
      process.env.NEXT_PUBLIC_MOCK_USDC as string,
    );
    setTxHash(tx.hash);
    setIsPending(true);
    tx.wait()
      .then(() => {
        setIsPending(false);
      })
      .catch((reason) => console.log(reason));
  }, [address, signer]);

  return (
    <div>
      {/* <div>{signer}</div> */}
      <TransactionButton
        text={'hi'}
        onClick={create}
        txHash={''}
        isPending={false}
      />
    </div>
  );
}
