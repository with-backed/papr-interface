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

const penguinsContractAddress = '0xbd3531da5cf5857e7cfaa92426877b022e612cf8';
const penguinTokenIds = ['2804', '3791', '7395'];

const dickbuttsContractAddress = '0x42069abfe407c60cf4ae4112bedead391dba1cdb';
const dickbuttsTokenIds = ['2318', '5341'];

export const Marquees = () => (
  <Wrapper>
    <NFTMarquee
      collateralContractAddress={penguinsContractAddress}
      tokenIds={penguinTokenIds}
    />
    <NFTMarquee
      collateralContractAddress={dickbuttsContractAddress}
      tokenIds={dickbuttsTokenIds}
    />
    <NFTMarquee
      collateralContractAddress={penguinsContractAddress}
      tokenIds={penguinTokenIds.slice(0, 1)}
    />
  </Wrapper>
);
