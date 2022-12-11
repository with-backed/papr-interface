import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

const LOCALE = 'en-US';
const USDC_FORMATTER = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
/**
 * Formats a number representing a quantity of tokens consistent with our design.
 * @param amount e.g., the result of `parseFloat(ethers.utils.formatUnits(...))`
 * @returns amount as string, e.g.: `939`, `2.34k`
 */

export function formatBigNum(num: BigNumber, decimals: BigNumberish): string {
  return parseFloat(formatUnits(num, decimals)).toFixed(3);
}

export function formatTokenAmount(amount: number) {
  return USDC_FORMATTER.format(amount);
}

const PERCENT_FORMATTER = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 2,
});
/**
 * Formats a number representing a percentage consistent with our design.
 * @param ratio e.g.: `0.34`, `0.01`, `1.5532`
 * @returns ratio as percentage string, e.g.: `34%`, `1%`, `155.32%`
 */
export function formatPercent(ratio: number) {
  return PERCENT_FORMATTER.format(ratio);
}

const THREE_FRACTION_DIGIT_FORMATTER = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 3,
});
/**
 * Format a number to a maximum of 3 fraction digits
 * @param n e.g.: `3`, `3.345678`
 * @returns number with at most 3 fraction digits, e.g.: `3`, `3.345`
 */
export function formatThreeFractionDigits(n: number) {
  return THREE_FRACTION_DIGIT_FORMATTER.format(n);
}

const PERCENT_CHANGE_FORMATTER = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
});
/**
 * Formats a number representing a percent change consistent with our design.
 * @param ratio e.g.: `0.34`, `-0.01`, `-1.5532`
 * @returns ratio as percentage string, e.g.: `+34%`, `-1%`, `-155.32%`
 */
export function formatPercentChange(ratio: number) {
  return PERCENT_CHANGE_FORMATTER.format(ratio);
}
