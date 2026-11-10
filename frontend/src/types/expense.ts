/**
 * Expense Tracker Types & Schema Definitions
 */

import { isValidCalendarDate } from '../utils/formatters';

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO format: YYYY-MM-DD
  note?: string;
  createdAt: string; // ISO 8601 string for secondary sorting stability
  updatedAt?: string;
}

export interface ExpenseFormData {
  title: string;
  amount: string | number;
  category: ExpenseCategory;
  date: string;
  note?: string;
}

export interface ExpenseFilter {
  category?: ExpenseCategory | 'All';
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface CategorySummary {
  category: ExpenseCategory;
  total: number;
  count: number;
  percentage: number;
}

export interface DailySummary {
  day: number;
  date: string;
  total: number;
  count: number;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  monthName: string; // e.g. "November 2026"
  totalSpent: number;
  expenseCount: number;
  averageSpent: number;
  categories: CategorySummary[];
  highestCategory?: {
    category: ExpenseCategory;
    total: number;
    percentage: number;
  };
  dailyBreakdown?: DailySummary[];
}

export interface ValidationError {
  field: keyof ExpenseFormData;
  message: string;
}

/**
 * Validates expense form data. Returns a list of validation errors if invalid.
 */
export function validateExpense(data: Partial<ExpenseFormData>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Title validation
  if (!data.title || data.title.trim() === '') {
    errors.push({ field: 'title', message: 'Title is required and cannot be empty' });
  } else if (data.title.trim().length > 100) {
    errors.push({ field: 'title', message: 'Title must be 100 characters or fewer' });
  }

  // Amount validation (Rupee)
  const rawAmount = String(data.amount || '').trim();
  const numAmount = typeof data.amount === 'number' ? data.amount : parseFloat(rawAmount);

  if (data.amount === undefined || rawAmount === '' || isNaN(numAmount)) {
    errors.push({ field: 'amount', message: 'Amount is required and must be a valid number' });
  } else if (numAmount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be greater than ₹0' });
  } else if (numAmount > 10000000) {
    errors.push({ field: 'amount', message: 'Amount cannot exceed ₹1,00,00,000 (1 Crore)' });
  } else if (!/^\d+(\.\d{1,2})?$/.test(rawAmount) && typeof data.amount === 'string') {
    // If entered as string with more than 2 decimal places or weird characters
    if (rawAmount.includes('.') && rawAmount.split('.')[1].length > 2) {
      errors.push({ field: 'amount', message: 'Amount cannot have more than 2 decimal places (paise)' });
    }
  }

  // Category validation
  if (!data.category || !EXPENSE_CATEGORIES.includes(data.category as ExpenseCategory)) {
    errors.push({ field: 'category', message: 'Please select a valid category from the list' });
  }

  // Date validation (with thorough calendar date check)
  if (!data.date) {
    errors.push({ field: 'date', message: 'Date is required' });
  } else {
    const calendarCheck = isValidCalendarDate(data.date);
    if (!calendarCheck.isValid) {
      errors.push({ field: 'date', message: calendarCheck.error || 'Invalid calendar date' });
    }
  }

  // Note validation (optional, max 500 chars)
  if (data.note && data.note.length > 500) {
    errors.push({ field: 'note', message: 'Note must be 500 characters or fewer' });
  }

  return errors;
}
