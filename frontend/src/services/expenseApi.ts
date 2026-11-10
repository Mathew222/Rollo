import {
  Expense,
  ExpenseFilter,
  ExpenseFormData,
  MonthlySummary,
} from '../types/expense';

const API_BASE = '/api/expenses';

export const expenseApi = {
  /**
   * Fetch all expenses with optional filtering
   */
  async getExpenses(filter?: ExpenseFilter): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filter?.category && filter.category !== 'All') {
      params.append('category', filter.category);
    }
    if (filter?.fromDate) {
      params.append('from', filter.fromDate);
    }
    if (filter?.toDate) {
      params.append('to', filter.toDate);
    }
    if (filter?.search) {
      params.append('search', filter.search);
    }

    const query = params.toString();
    const url = query ? `${API_BASE}?${query}` : API_BASE;

    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch expenses');
    }
    return res.json();
  },

  /**
   * Get monthly summary for a specific month (YYYY-MM)
   */
  async getSummary(month?: string): Promise<MonthlySummary> {
    const url = month ? `${API_BASE}/summary?month=${encodeURIComponent(month)}` : `${API_BASE}/summary`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch monthly summary');
    }
    return res.json();
  },

  /**
   * Create a new expense
   */
  async createExpense(data: ExpenseFormData): Promise<Expense> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create expense');
    }
    return res.json();
  },

  /**
   * Update an existing expense
   */
  async updateExpense(id: string, data: ExpenseFormData): Promise<Expense> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update expense');
    }
    return res.json();
  },

  /**
   * Delete an expense
   */
  async deleteExpense(id: string): Promise<Expense> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete expense');
    }
    const result = await res.json();
    return result.deleted;
  },

  /**
   * Reset data to demo state
   */
  async resetDemo(): Promise<void> {
    const res = await fetch(`${API_BASE}/reset-demo`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error('Failed to reset demo data');
    }
  },

  /**
   * Clear all uploaded expenses
   */
  async clearAllExpenses(): Promise<void> {
    const res = await fetch(`${API_BASE}/clear-all`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error('Failed to clear expenses');
    }
  },
};
