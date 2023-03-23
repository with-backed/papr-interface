import { Tooltip, TooltipReference as TTR } from 'components/Tooltip';
import { formatPercent } from 'lib/numberFormat';
import { useTooltipState } from 'reakit/Tooltip';

export function VaultDebtExplainer() {
  const currentLTVTooltip = useTooltipState();
  const accruingInterestTooltip = useTooltipState();
  const nftValueTooltip = useTooltipState();

  // placeholder variables (will become props/calculations)
  const currentLTV = 0.25;
  const maxLTV = 0.5;
  const daysToLiquidation = 199;
  const liquidationTriggerPrice = '0.455 ETH';

  return (
    <>
      <p>
        Loan liquidates when <TTR {...currentLTVTooltip}>Current LTV</TTR> (
        {formatPercent(currentLTV)}) reaches Max LTV ({formatPercent(maxLTV)}).
        This can happen by{' '}
        <TTR {...accruingInterestTooltip}>accruing interest</TTR> or by a drop
        in <TTR {...nftValueTooltip}>NFT value</TTR>.
      </p>
      <Tooltip {...currentLTVTooltip}>TODO</Tooltip>
      <Tooltip {...accruingInterestTooltip}>
        {daysToLiquidation === 0
          ? 'The current interest rate is negative, and is not currently moving this loan closer to liquidation.'
          : `Assuming today's interest rate and NFT price, interest charges will result in liquidation after ${daysToLiquidation} days.`}
      </Tooltip>
      <Tooltip {...nftValueTooltip}>
        If contract&apos;s valuation of the collateral drops below{' '}
        {liquidationTriggerPrice}, this loan will be liquidated at auction to
        cover the debt.
      </Tooltip>
    </>
  );
}
