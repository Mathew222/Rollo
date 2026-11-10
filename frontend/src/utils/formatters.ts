import { ExpenseCategory } from '../types/expense';

/**
 * Format number as Indian Rupee (₹) with en-IN numbering convention
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0.00';
  }

  // Format using en-IN locale with currency symbol ₹
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Get today's date in YYYY-MM-DD local format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current month string in YYYY-MM format
 */
export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Format YYYY-MM to readable month (e.g., "November 2026")
 */
export function formatMonthName(monthStr: string): string {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    return monthStr || '';
  }
  const [yearStr, monthStrPart] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStrPart, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return monthStr;
  }

  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Thorough calendar date validator:
 * Checks regex YYYY-MM-DD, month 1-12, day 1-31, leap years, and rollover prevention (e.g. Feb 31).
 */
export function isValidCalendarDate(dateStr: string): { isValid: boolean; error?: string } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, error: 'Date is required' };
  }

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return { isValid: false, error: 'Date must be formatted as YYYY-MM-DD' };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid month (must be between 01 and 12)' };
  }

  if (year < 1900 || year > 2100) {
    return { isValid: false, error: 'Year must be between 1900 and 2100' };
  }

  // Check actual days in the specified month
  const testDate = new Date(year, month - 1, day);
  if (
    testDate.getFullYear() !== year ||
    testDate.getMonth() !== month - 1 ||
    testDate.getDate() !== day
  ) {
    return {
      isValid: false,
      error: `Invalid calendar date: Day ${day} does not exist in ${formatMonthName(`${year}-${String(month).padStart(2, '0')}`)}`,
    };
  }

  return { isValid: true };
}

/**
 * Format YYYY-MM-DD to readable date (e.g., "Nov 10, 2026") with relative label if today/yesterday
 */
export function formatDate(dateStr: string): { formatted: string; relative?: string } {
  if (!dateStr) return { formatted: '' };

  const validation = isValidCalendarDate(dateStr);
  if (!validation.isValid) {
    return { formatted: dateStr, relative: 'Invalid Date' };
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let relative: string | undefined;
  if (diffDays === 0) relative = 'Today';
  else if (diffDays === 1) relative = 'Yesterday';
  else if (diffDays === -1) relative = 'Tomorrow';

  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return { formatted, relative };
}

/**
 * Visual metadata for categories (color, theme, styling)
 */
export interface CategoryVisual {
  color: string;
  bgLight: string;
  borderLight: string;
  textDark: string;
  dotColor: string;
}

export const CATEGORY_STYLES: Record<ExpenseCategory, CategoryVisual> = {
  Food: {
    color: '#0284c7', // sky-600
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200',
    textDark: 'text-sky-700',
    dotColor: 'bg-sky-500',
  },
  Transport: {
    color: '#0d9488', // teal-600
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-200',
    textDark: 'text-teal-700',
    dotColor: 'bg-teal-500',
  },
  Shopping: {
    color: '#7c3aed', // violet-600
    bgLight: 'bg-violet-50',
    borderLight: 'border-violet-200',
    textDark: 'text-violet-700',
    dotColor: 'bg-violet-500',
  },
  Bills: {
    color: '#ea580c', // orange-600
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-200',
    textDark: 'text-orange-700',
    dotColor: 'bg-orange-500',
  },
  Entertainment: {
    color: '#db2777', // pink-600
    bgLight: 'bg-pink-50',
    borderLight: 'border-pink-200',
    textDark: 'text-pink-700',
    dotColor: 'bg-pink-500',
  },
  Other: {
    color: '#4b5563', // gray-600
    bgLight: 'bg-neutral-100',
    borderLight: 'border-neutral-200',
    textDark: 'text-neutral-700',
    dotColor: 'bg-neutral-500',
  },
};
