import { CenterProvider } from '@center-inc/react';
import { ConfigProvider } from 'hooks/useConfig';
import { configs } from 'lib/config';
import React, { FunctionComponent } from 'react';

import { NFTMarquee } from './NFTMarquee';

const Wrapper: FunctionComponent = ({ children }) => (
  <ConfigProvider token="paprMeme">
    <CenterProvider
      network={configs.paprMeme.centerNetwork as any}
      apiKey="key-43ed0f00c03c-4cf3908a1526">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          width: 'max-content',
          padding: '2rem',
        }}>
        {children}
      </div>
    </CenterProvider>
  </ConfigProvider>
);

const penguins = [
  {
    id: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8-2804',
    tokenId: '2804',
    __typename: 'VaultCollateral' as const,
  },
  {
    id: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8-3791',
    tokenId: '3791',
    __typename: 'VaultCollateral' as const,
  },
  {
    id: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8-7395',
    tokenId: '7395',
    __typename: 'VaultCollateral' as const,
  },
];

const dickbutts = [
  {
    id: '0x42069abfe407c60cf4ae4112bedead391dba1cdb-2318',
    tokenId: '2318',
    __typename: 'VaultCollateral' as const,
  },
  {
    id: '0x42069abfe407c60cf4ae4112bedead391dba1cdb-5341',
    tokenId: '5341',
    __typename: 'VaultCollateral' as const,
  },
];

export const Marquees = () => (
  <Wrapper>
    <NFTMarquee collateral={[...penguins, ...dickbutts]} />
    <NFTMarquee collateral={penguins} />
    <NFTMarquee collateral={dickbutts} />
    <NFTMarquee collateral={penguins.slice(0, 1)} />
  </Wrapper>
);
