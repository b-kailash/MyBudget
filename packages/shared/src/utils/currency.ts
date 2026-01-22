/**
 * Currency formatting and parsing utilities
 */

/**
 * Format a number as currency
 * @param amount - The numeric amount to format
 * @param currency - The currency code (ISO 4217, e.g., 'USD', 'EUR')
 * @param locale - Optional locale for formatting (defaults to 'en-US')
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56, 'USD') // "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de-DE') // "1.234,56 €"
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    console.error(`Invalid currency code: ${currency}`, error);
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Parse a currency string to a number
 * Removes currency symbols, thousands separators, and converts to number
 * @param value - The currency string to parse
 * @returns Parsed numeric value
 *
 * @example
 * parseCurrency('$1,234.56') // 1234.56
 * parseCurrency('1.234,56 €') // 1234.56
 * parseCurrency('-$500.00') // -500
 */
export function parseCurrency(value: string): number {
  if (typeof value !== 'string') {
    return Number(value) || 0;
  }

  // Remove all non-numeric characters except decimal point, comma, and minus sign
  let cleaned = value.replace(/[^\d.,-]/g, '');

  // Detect if comma is used as decimal separator (European format)
  // This is true if there's a comma after the last period, or if there's only a comma
  const lastPeriod = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  if (lastComma > lastPeriod) {
    // European format: 1.234,56 or 1234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: 1,234.56 or 1234.56
    cleaned = cleaned.replace(/,/g, '');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number as compact currency (with K, M, B suffixes)
 * @param amount - The numeric amount to format
 * @param currency - The currency code (ISO 4217)
 * @param locale - Optional locale for formatting (defaults to 'en-US')
 * @returns Formatted compact currency string
 *
 * @example
 * formatCompactCurrency(1234, 'USD') // "$1.2K"
 * formatCompactCurrency(1234567, 'USD') // "$1.2M"
 */
export function formatCompactCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    console.error(`Invalid currency code: ${currency}`, error);
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absAmount >= 1e9) {
      return `${sign}${currency} ${(absAmount / 1e9).toFixed(1)}B`;
    } else if (absAmount >= 1e6) {
      return `${sign}${currency} ${(absAmount / 1e6).toFixed(1)}M`;
    } else if (absAmount >= 1e3) {
      return `${sign}${currency} ${(absAmount / 1e3).toFixed(1)}K`;
    } else {
      return `${sign}${currency} ${absAmount.toFixed(2)}`;
    }
  }
}
