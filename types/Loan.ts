import { BigNumber } from '@ethersproject/bignumber';

export type Loan = {
  id: BigNumber;
  loanAssetContractAddress: string;
  collateralContractAddress: string;
  collateralTokenId: BigNumber;
  collateralName: string;
  perAnumInterestRate: BigNumber;
  accumulatedInterest: BigNumber;
  lastAccumulatedTimestamp: BigNumber;
  durationSeconds: BigNumber;
  loanAmount: BigNumber;
  closed: boolean;
  loanAssetDecimals: number;
  loanAssetSymbol: string;
  lender: string | null;
  borrower: string;
  interestOwed: BigNumber;
  endDateTimestamp: number;
  collateralTokenURI: string;
  allowLoanAmountIncrease: boolean;
};
