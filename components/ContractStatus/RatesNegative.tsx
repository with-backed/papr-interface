import { useConfig } from 'hooks/useConfig';
import { useMemo } from 'react';
import { DisclosureContent, useDisclosureState } from 'reakit/Disclosure';

import { Fieldset, Price, RatesProps, Summary } from './Common';
import styles from './ContractStatus.module.css';

export function RatesNegative({
  contractRate,
  marketPrice,
  targetPrice,
}: RatesProps) {
  const disclosureState = useDisclosureState({ animated: true });
  const { tokenName } = useConfig();

  const explainers = useMemo(
    () => ({
      demand: `Liquidity for loans comes from the Uniswap pool, which
      lenders add to by swapping USDC for ${tokenName}. So Lender demand
      corresponds to BUY pressure on papr, driving up the market price
      of ${tokenName}.`,
      setsRate: `Contract Rate is the current rate the protocol uses to
      assess interest payments on loans. The current rate is negative,
      meaning that the Contract is levying a charge against Lenders, to
      the benefit of Borrowers.`,
      borrowers: `Because the protocol uses Contract Rate to assess loan
      values and liquidations, existing loans become further from the liquidation
      threshold. Borrowers can borrow more, minting and selling ${tokenName} in 
      the process, which exerts a downward pressure on Market Price.`,
      lenders: `Lenders accrue interest in the form of price appreciation of
      ${tokenName}, so if the contract moves to lower rates, it means potential
      negative returns for Lenders, who may sell, driving down Market Price.`,
      valuation: `The contract computes the Target Price by observing how the
      market has moved since its last adjustment. Target Price is used in
      calculating loan values, repayments, and the current Contract Rate.`,
    }),
    [tokenName],
  );

  return (
    <Fieldset>
      <Summary disclosureState={disclosureState}>
        🧊 Contract is acting to cool down Market Price
      </Summary>
      <div data-testid="rates-negative" className={styles.chart}>
        <div className={styles['chart-prices']}>
          <Price kind="market" value={marketPrice} />
          <Price kind="target" value={targetPrice} />
        </div>
        <div className={styles['chart-lines']}>
          <span>∙</span>
          <span>∙</span>
          <span>∙</span>
          <span data-pointer-target="market">
            🔥 Demand from Lenders has driven up price
          </span>
          <DisclosureContent {...disclosureState} className={styles.explainer}>
            {explainers.demand}
          </DisclosureContent>
          <span>🧊 Contract: rate set to {contractRate}</span>
          <DisclosureContent {...disclosureState} className={styles.explainer}>
            {explainers.setsRate}
          </DisclosureContent>
          <span>🧊 Borrowers: Better terms, more loans</span>
          <DisclosureContent {...disclosureState} className={styles.explainer}>
            {explainers.borrowers}
          </DisclosureContent>
          <span>🧊 Lenders: Lower return from holding {tokenName}</span>
          <DisclosureContent {...disclosureState} className={styles.explainer}>
            {explainers.lenders}
          </DisclosureContent>
          <span data-pointer-target="target">
            🍜 Contract&apos;s valuation of {tokenName}
          </span>
          <DisclosureContent {...disclosureState} className={styles.explainer}>
            {explainers.valuation}
          </DisclosureContent>
          <span>∙</span>
          <span>∙</span>
          <span>∙</span>
        </div>
      </div>
    </Fieldset>
  );
}
