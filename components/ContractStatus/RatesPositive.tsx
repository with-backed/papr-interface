import { useConfig } from 'hooks/useConfig';
import { useMemo } from 'react';
import { DisclosureContent, useDisclosureState } from 'reakit/Disclosure';

import { Fieldset, Price, RatesProps, Summary } from './Common';
import styles from './ContractStatus.module.css';

export function RatesPositive({
  contractRate,
  marketPrice,
  targetPrice,
}: RatesProps) {
  const disclosureState = useDisclosureState({ animated: true });
  const { tokenName } = useConfig();

  const explainers = useMemo(
    () => ({
      valuation: `The contract computes the Target Price by observing
      how the market has moved since its last adjustment. Target Price
      is used in calculating loan values, repayments, and the current
      Contract Rate.`,
      contractRate: `Contract Rate is the current rate the protocol uses
      to assess interest payments on loans. The current rate is positive,
      meaning that the Contract is levying a charge against Borrowers and
      attempting to reward ${tokenName} holders.`,
      borrowers: `As interest charges accrue in the form of higher Market
      Prices for ${tokenName}, loans cost more to close and Borrowers eventually
      must repay or face liquidation. The ${tokenName} used for repayment is repurchased
      (upward pressure on price) and then burned, decreasing supply.`,
      lenders: `Lenders profit from their position as holders of ${tokenName} as the
      price of the token rises. A positive Contract Rate means potential for positive
      returns to token holders, increasing demand for ${tokenName}, exerting further
      upward pressure on Market Price. `,
      demand: `The Uniswap price reflects an equilibrium between ${tokenName} sellers
      (borrowers) and ${tokenName} buyers (lenders). An increase in this price is
      effectively an interest payment: a charge to borrowers and a payment to lenders.`,
    }),
    [tokenName],
  );

  return (
    <Fieldset>
      <Summary
        contractRate={contractRate}
        direction="positive"
        disclosureState={disclosureState}
      />
      <div data-testid="rates-positive" className={styles.chart}>
        <div className={styles['chart-prices']}>
          <Price kind="target" value={targetPrice} />
          <Price kind="market" value={marketPrice} />
        </div>
        <div className={styles['chart-lines']}>
          <span>∙</span>
          <span>∙</span>
          <span>∙</span>
          <span data-pointer-target="target">
            🍜 Contract&apos;s valuation of {tokenName}
          </span>
          <DisclosureContent {...disclosureState} className={styles.explainer}>
            {explainers.valuation}
          </DisclosureContent>
          <span>🔥 Borrowers: loans move toward liquidation</span>
          <DisclosureContent {...disclosureState} className={styles.explainer}>
            {explainers.borrowers}
          </DisclosureContent>
          <span>🔥 Lenders: incentivized by positive rate</span>
          <DisclosureContent {...disclosureState} className={styles.explainer}>
            {explainers.lenders}
          </DisclosureContent>
          <span>🔥 Contract: set rate to {contractRate}</span>
          <DisclosureContent {...disclosureState} className={styles.explainer}>
            {explainers.contractRate}
          </DisclosureContent>
          <span data-pointer-target="market">
            🧊 Demand for loans balanced w/ demand for {tokenName}
          </span>
          <DisclosureContent {...disclosureState} className={styles.explainer}>
            {explainers.demand}
          </DisclosureContent>
          <span>∙</span>
          <span>∙</span>
          <span>∙</span>
        </div>
      </div>
    </Fieldset>
  );
}
