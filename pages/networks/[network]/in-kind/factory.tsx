import { TransactionButton } from 'components/Button';
import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import { validateNetwork } from 'lib/config';
import { ONE } from 'lib/strategies/constants';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { StrategyFactory__factory } from 'types/generated/abis';
import { LendingStrategiesDocument } from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';
import { useSigner } from 'wagmi';
import styles from 'components/Strategies/Strategy.module.css';

export default function Factory() {
  const { data: signer } = useSigner();

  return <div>{signer == undefined ? 'no signer' : <Connected />}</div>;
}

export const getServerSideProps: GetServerSideProps<{}> = async (context) => {
  try {
    validateNetwork(context.params!);
  } catch (e) {
    return { notFound: true };
  }

  return { props: {} };
};

function Connected() {
  const { data: signer } = useSigner();
  const [txHash, setTxHash] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { network } = useConfig();
  const { push } = useRouter();
  const [{ data, fetching }] = useQuery({ query: LendingStrategiesDocument });

  const create = useCallback(async () => {
    let strategy = StrategyFactory__factory.connect(
      process.env.NEXT_PUBLIC_STRATEGY_FACTORY as string,
      signer!,
    );
    const tx = await strategy.newStrategy(
      'APE Loans',
      'AP',
      ethers.utils.formatBytes32String('x'),
      ONE.div(10).mul(2), // 20% APR target
      ONE.div(10).mul(5), // 50% Max LTV,
      process.env.NEXT_PUBLIC_MOCK_USDC as string,
    );

    const filter = strategy.filters.CreateLendingStrategy(null);
    strategy.once(filter, (address) => {
      push(`/networks/${network}/in-kind/strategies/${address}`);
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
    <div className={styles.column}>
      {/* <div>{signer}</div> */}
      <TransactionButton
        text={'Create a Strategy'}
        onClick={create}
        txHash={txHash}
        isPending={isPending}
      />
      <Fieldset legend="🗺️ Existing Strategies">
        {fetching && <p>Loading strategies...</p>}
        {!fetching && !!data && (
          <ul>
            {data.lendingStrategies.map((s) => {
              return (
                <li key={s.id}>
                  <Link
                    href={`/networks/${network}/in-kind/strategies/${s.id}`}>
                    <a>{s.id}</a>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Fieldset>
    </div>
  );
}
