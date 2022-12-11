import { BigNumber } from '@ethersproject/bignumber';

export interface NFTEntity {
  id: string;
  identifier: BigNumber;
  uri?: string | null;
  registry: {
    symbol?: string | null;
    name?: string | null;
  };
  approvals: Approval[];
}

interface Approval {
  id: string;
  approved: {
    id: string;
  };
}
