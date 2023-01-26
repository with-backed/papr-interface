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
      meaning that the Contract is levying a charge against Borrowers.`,
      borrowers: `As interest charges accrue in the form of higher Market
      Prices for ${tokenName}, loans cost more to close and Borrowers eventually
      must repay their loans or face liquidation. This repayment requires burning
      ${tokenName}, which decreases supply, which exerts an upward pressure on
      Market Price.`,
      lenders: `Lenders profit from their position as holders of ${tokenName} as the
      price of the token rises. A positive Contract Rate means potential for positive
      returns to token holders, increasing demand for ${tokenName}, exerting further
      upward pressure on Market Price. `,
      demand: `Borrower demand is sufficient to support the current Market Price, and
      may support a higher price. By raising rates, the Contrast motivates Lenders to
      supply additional capital and exerts downward pressure on demand from Borrowers,
      who may borrow less as the rates go up.`,
    }),
    [tokenName],
  );

  return (
    <Fieldset>
      <Summary disclosureState={disclosureState}>
        🔥 Contract is acting to raise Market Price
      </Summary>
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
          <DisclosureContent {...disclosureState}>
            {explainers.valuation}
          </DisclosureContent>
          <span>🔥 Contract Rate raised to {contractRate}</span>
          <DisclosureContent {...disclosureState}>
            {explainers.contractRate}
          </DisclosureContent>
          <span>🔥 Borrowers: loans get more expensive</span>
          <DisclosureContent {...disclosureState}>
            {explainers.borrowers}
          </DisclosureContent>
          <span>🔥 Lenders: incentivized by price increase</span>
          <DisclosureContent {...disclosureState}>
            {explainers.lenders}
          </DisclosureContent>
          <span data-pointer-target="market">
            🧊 Borrower demand supports higher rates
          </span>
          <DisclosureContent {...disclosureState}>
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
