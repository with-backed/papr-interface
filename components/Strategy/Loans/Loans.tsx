import { Fieldset } from 'components/Fieldset';
import { ethers } from 'ethers';
import { useConfig } from 'hooks/useConfig';
import Link from 'next/link';
import React from 'react';
import { VaultsByStrategyDocument } from 'types/generated/graphql/inKindSubgraph';
import { useQuery } from 'urql';

type Vault = {
  __typename?: 'Vault' | undefined;
  id: string;
  tokenId: any;
  debt: any;
  open: boolean;
  owner: {
    __typename?: 'Account' | undefined;
    id: string;
  };
};

type LoansProps = {
  strategy: string;
};
export function Loans({ strategy }: LoansProps) {
  const [{ data, fetching }] = useQuery({
    query: VaultsByStrategyDocument,
    variables: { strategy },
  });
  data?.vaults;
  return (
    <Fieldset legend="🔐 Associated Vaults">
      {fetching && <Loading />}
      {!fetching && !!data && (
        <Loaded strategy={strategy} vaults={data.vaults} />
      )}
    </Fieldset>
  );
}

function Loading() {
  return <p>Loading vaults...</p>;
}

type LoadedProps = {
  strategy: string;
  vaults: Vault[];
};
function Loaded({ strategy, vaults }: LoadedProps) {
  const { network } = useConfig();
  if (vaults.length === 0) {
    return <p>No vaults associated with this strategy</p>;
  }

  return (
    <ul>
      {vaults.map((v) => {
        return (
          <li key={v.id}>
            <Link
              href={`/network/${network}/in-kind/strategies/${strategy}/vaults/${ethers.BigNumber.from(
                v.id,
              )}`}>
              <a>
                {v.id.substring(0, 16)}... ({v.open ? 'open' : 'closed'})
              </a>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
