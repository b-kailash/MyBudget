/**
 * Date formatting and manipulation utilities
 */

import {
  format as fnsFormat,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isValid,
} from 'date-fns';
import { BudgetPeriod } from '../types/enums';

/**
 * Format a date using a specified format string
 * @param date - The date to format (Date object or ISO string)
 * @param formatString - The format string (defaults to 'yyyy-MM-dd')
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2024-01-15')) // "2024-01-15"
 * formatDate(new Date('2024-01-15'), 'MMM dd, yyyy') // "Jan 15, 2024"
 * formatDate('2024-01-15T10:30:00Z', 'PPpp') // "Jan 15, 2024, 10:30:00 AM"
 */
export function formatDate(
  date: Date | string,
  formatString: string = 'yyyy-MM-dd'
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      throw new Error('Invalid date');
    }

    return fnsFormat(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
}

/**
 * Parse an ISO date string to a Date object
 * @param value - The ISO date string to parse
 * @returns Parsed Date object
 *
 * @example
 * parseDate('2024-01-15') // Date object for 2024-01-15
 * parseDate('2024-01-15T10:30:00Z') // Date object with time
 */
export function parseDate(value: string): Date {
  const date = parseISO(value);

  if (!isValid(date)) {
    throw new Error(`Invalid date string: ${value}`);
  }

  return date;
}

/**
 * Get the start of a budget period
 * @param date - The reference date
 * @param period - The budget period type
 * @returns Date object representing the start of the period
 *
 * @example
 * getStartOfPeriod(new Date('2024-01-15'), BudgetPeriod.MONTHLY) // 2024-01-01
 * getStartOfPeriod(new Date('2024-01-15'), BudgetPeriod.WEEKLY) // 2024-01-14 (Sunday)
 */
export function getStartOfPeriod(date: Date, period: BudgetPeriod): Date {
  switch (period) {
    case BudgetPeriod.WEEKLY:
      return startOfWeek(date, { weekStartsOn: 0 }); // Sunday
    case BudgetPeriod.MONTHLY:
      return startOfMonth(date);
    case BudgetPeriod.YEARLY:
      return startOfYear(date);
    default:
      throw new Error(`Invalid budget period: ${period}`);
  }
}

/**
 * Get the end of a budget period
 * @param date - The reference date
 * @param period - The budget period type
 * @returns Date object representing the end of the period
 *
 * @example
 * getEndOfPeriod(new Date('2024-01-15'), BudgetPeriod.MONTHLY) // 2024-01-31
 * getEndOfPeriod(new Date('2024-01-15'), BudgetPeriod.WEEKLY) // 2024-01-20 (Saturday)
 */
export function getEndOfPeriod(date: Date, period: BudgetPeriod): Date {
  switch (period) {
    case BudgetPeriod.WEEKLY:
      return endOfWeek(date, { weekStartsOn: 0 }); // Sunday
    case BudgetPeriod.MONTHLY:
      return endOfMonth(date);
    case BudgetPeriod.YEARLY:
      return endOfYear(date);
    default:
      throw new Error(`Invalid budget period: ${period}`);
  }
}

/**
 * Convert a Date object to an ISO string (YYYY-MM-DD)
 * @param date - The date to convert
 * @returns ISO date string
 *
 * @example
 * toISODate(new Date('2024-01-15T10:30:00Z')) // "2024-01-15"
 */
export function toISODate(date: Date): string {
  return formatDate(date, 'yyyy-MM-dd');
}

/**
 * Convert a Date object to an ISO datetime string
 * @param date - The date to convert
 * @returns ISO datetime string
 *
 * @example
 * toISODateTime(new Date('2024-01-15T10:30:00Z')) // "2024-01-15T10:30:00.000Z"
 */
export function toISODateTime(date: Date): string {
  return date.toISOString();
}

/**
 * Check if a date string is valid
 * @param value - The date string to validate
 * @returns True if the date is valid, false otherwise
 *
 * @example
 * isValidDate('2024-01-15') // true
 * isValidDate('invalid') // false
 */
export function isValidDate(value: string): boolean {
  try {
    const date = parseISO(value);
    return isValid(date);
  } catch {
    return false;
  }
}
