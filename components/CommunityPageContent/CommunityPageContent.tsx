import React from 'react';
import { OpenGraph } from 'components/OpenGraph';
import { useConfig } from 'hooks/useConfig';
import {
  CommunityHeaderDisconnected,
  CommunityHeader,
} from 'components/CommunityHeader';
import { CommunityInfo } from 'components/CommunityInfo';
import styles from './CommunityPageContent.module.css';
import { AccessoryLookup, CommunityAccount } from 'lib/community';
import { CommunityActivity } from 'components/CommunityActivity';

export function CommunityPage() {
  return (
    <div className={styles.container}>
      <OpenGraph
        title="Backed | Community"
        description="Mint or manage your Backed Community NFT"
      />
      <CommunityHeaderDisconnected />
      <CommunityInfo />
    </div>
  );
}

type CommunityAddressPageProps = {
  address: string;
  account: CommunityAccount | null;
  accessoryLookup: AccessoryLookup;
};
export function CommunityAddressPage({
  account,
  address,
  accessoryLookup,
}: CommunityAddressPageProps) {
  const { network } = useConfig();
  return (
    <div className={styles.container}>
      <OpenGraph
        // TODO: show actual NFT? Will need to convert to non-SVG format.
        title={`Backed | Community Profile for ${address}`}
        description="View this Community profile"
      />
      <CommunityHeader
        account={account}
        address={address}
        accessoryLookup={accessoryLookup}
      />
      <CommunityActivity account={account} />
      <CommunityInfo />
    </div>
  );
}
