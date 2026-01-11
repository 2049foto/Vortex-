/**
 * Vortex Protocol - Precision Financial Calculations
 * Uses decimal.js to prevent floating-point precision loss
 * 
 * CRITICAL: All USD calculations MUST use these functions
 */

import Decimal from 'decimal.js';

// Configure Decimal for financial precision
Decimal.set({
  precision: 20,      // 20 significant digits
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -18,      // Use exponential notation below 10^-18
  toExpPos: 20,       // Use exponential notation above 10^20
});

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE ARITHMETIC OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Safely add multiple numbers
 */
export function safeAdd(...values: (string | number | Decimal)[]): Decimal {
  return values.reduce<Decimal>((sum, val) => sum.plus(toDecimal(val)), new Decimal(0));
}

/**
 * Safely subtract b from a
 */
export function safeSub(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

/**
 * Safely multiply multiple numbers
 */
export function safeMul(...values: (string | number | Decimal)[]): Decimal {
  if (values.length === 0) return new Decimal(0);
  return values.reduce<Decimal>((product, val) => product.times(toDecimal(val)), new Decimal(1));
}

/**
 * Safely divide a by b (returns 0 if b is 0)
 */
export function safeDiv(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) return new Decimal(0);
  return toDecimal(a).dividedBy(divisor);
}

// ═══════════════════════════════════════════════════════════════════════════════
// USD FORMATTING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format as USD with proper precision
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 2 for USD)
 */
export function formatUsd(value: string | number | Decimal, decimals: number = 2): string {
  const dec = toDecimal(value);
  
  // Very small values - show more decimals
  if (dec.abs().lt(0.01) && !dec.isZero()) {
    return dec.toFixed(4);
  }
  
  return dec.toFixed(decimals);
}

/**
 * Format as USD with dollar sign
 */
export function formatUsdDisplay(value: string | number | Decimal): string {
  const dec = toDecimal(value);
  const formatted = formatUsd(dec);
  return dec.isNegative() ? `-$${formatted.slice(1)}` : `$${formatted}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN BALANCE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert raw balance to formatted balance
 * @param rawBalance - Balance in wei/smallest unit (string or bigint)
 * @param decimals - Token decimals (default: 18)
 */
export function formatTokenBalance(
  rawBalance: string | bigint,
  decimals: number = 18
): string {
  const raw = new Decimal(rawBalance.toString());
  const divisor = new Decimal(10).pow(decimals);
  return raw.dividedBy(divisor).toString();
}

/**
 * Convert formatted balance to raw balance
 * @param formattedBalance - Human-readable balance
 * @param decimals - Token decimals (default: 18)
 */
export function toRawBalance(
  formattedBalance: string | number,
  decimals: number = 18
): string {
  const formatted = toDecimal(formattedBalance);
  const multiplier = new Decimal(10).pow(decimals);
  return formatted.times(multiplier).toFixed(0);
}

/**
 * Calculate token value in USD
 * @param balance - Token balance (formatted or raw)
 * @param priceUsd - Price per token in USD
 * @param decimals - If balance is raw, provide decimals for conversion
 */
export function calculateValueUsd(
  balance: string | number,
  priceUsd: string | number,
  decimals?: number
): Decimal {
  let balanceDecimal = toDecimal(balance);
  
  // If decimals provided, assume balance is raw
  if (decimals !== undefined) {
    const divisor = new Decimal(10).pow(decimals);
    balanceDecimal = balanceDecimal.dividedBy(divisor);
  }
  
  return balanceDecimal.times(toDecimal(priceUsd));
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate percentage of a value
 * @param value - The base value
 * @param percentBps - Percentage in basis points (100 = 1%)
 */
export function calculatePercentage(
  value: string | number | Decimal,
  percentBps: number
): Decimal {
  return toDecimal(value).times(percentBps).dividedBy(10000);
}

/**
 * Calculate platform fee
 * @param valueUsd - Transaction value in USD
 * @param feePct - Fee percentage (e.g., 0.8 for 0.8%)
 */
export function calculatePlatformFee(
  valueUsd: string | number | Decimal,
  feePct: number = 0.8
): Decimal {
  return toDecimal(valueUsd).times(feePct).dividedBy(100);
}

/**
 * Calculate net output after fees
 * @param grossValue - Value before fees
 * @param fees - Array of fee amounts to subtract
 */
export function calculateNetOutput(
  grossValue: string | number | Decimal,
  fees: (string | number | Decimal)[]
): Decimal {
  const gross = toDecimal(grossValue);
  const totalFees = safeAdd(...fees);
  return gross.minus(totalFees);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIPPAGE & PRICE IMPACT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate minimum output with slippage
 * @param expectedOutput - Expected output amount
 * @param slippagePct - Slippage tolerance (e.g., 0.5 for 0.5%)
 */
export function calculateMinOutput(
  expectedOutput: string | number | Decimal,
  slippagePct: number = 0.5
): Decimal {
  const expected = toDecimal(expectedOutput);
  const slippageFactor = new Decimal(1).minus(new Decimal(slippagePct).dividedBy(100));
  return expected.times(slippageFactor);
}

/**
 * Calculate price impact
 * @param inputValue - Input value in USD
 * @param outputValue - Output value in USD
 */
export function calculatePriceImpact(
  inputValue: string | number | Decimal,
  outputValue: string | number | Decimal
): number {
  const input = toDecimal(inputValue);
  const output = toDecimal(outputValue);
  
  if (input.isZero()) return 0;
  
  const impact = input.minus(output).dividedBy(input).times(100);
  return impact.toNumber();
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARISON UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if value A is greater than value B
 */
export function isGreater(a: string | number | Decimal, b: string | number | Decimal): boolean {
  return toDecimal(a).gt(toDecimal(b));
}

/**
 * Check if value A is less than value B
 */
export function isLess(a: string | number | Decimal, b: string | number | Decimal): boolean {
  return toDecimal(a).lt(toDecimal(b));
}

/**
 * Check if value is zero or negative
 */
export function isZeroOrNegative(value: string | number | Decimal): boolean {
  return toDecimal(value).lte(0);
}

/**
 * Get maximum of multiple values
 */
export function max(...values: (string | number | Decimal)[]): Decimal {
  if (values.length === 0) return new Decimal(0);
  return Decimal.max(...values.map(toDecimal));
}

/**
 * Get minimum of multiple values
 */
export function min(...values: (string | number | Decimal)[]): Decimal {
  if (values.length === 0) return new Decimal(0);
  return Decimal.min(...values.map(toDecimal));
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Safely convert any value to Decimal
 */
function toDecimal(value: string | number | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined) return new Decimal(0);
  if (value instanceof Decimal) return value;
  
  try {
    // Handle NaN and Infinity
    if (typeof value === 'number') {
      if (Number.isNaN(value) || !Number.isFinite(value)) {
        return new Decimal(0);
      }
    }
    
    // Handle empty strings
    if (typeof value === 'string' && value.trim() === '') {
      return new Decimal(0);
    }
    
    return new Decimal(value);
  } catch {
    return new Decimal(0);
  }
}

// Export Decimal class for advanced usage
export { Decimal };

// Export toDecimal for direct usage
export { toDecimal };
