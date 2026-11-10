/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { Header } from './components/Header';
import { OverviewHero } from './components/OverviewHero';
import { CategoryGrid } from './components/CategoryGrid';
import { ExpenseFilters } from './components/ExpenseFilters';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Toast, ToastMessage } from './components/Toast';
import { expenseApi } from './services/expenseApi';
import {
  Expense,
  ExpenseCategory,
  ExpenseFilter,
  ExpenseFormData,
  MonthlySummary,
} from './types/expense';
import { getCurrentMonthString } from './utils/formatters';

export default function App() {
  // Primary state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'categories'>('dashboard');

  // Filter state
  const [filter, setFilter] = useState<ExpenseFilter>({
    category: 'All',
    fromDate: undefined,
    toDate: undefined,
    search: '',
  });

  // Modal & Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Loading states
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Notification Toast state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Fetch summary for selected month
  const loadSummary = useCallback(async (month: string) => {
    setIsLoadingSummary(true);
    try {
      const data = await expenseApi.getSummary(month);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load monthly summary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  // Fetch all expenses matching the current filter
  const loadExpenses = useCallback(async (currentFilter: ExpenseFilter) => {
    setIsLoadingExpenses(true);
    try {
      const data = await expenseApi.getExpenses(currentFilter);
      setExpenses(data);

      const hasActiveFilters = Boolean(
        (currentFilter.category && currentFilter.category !== 'All') ||
          currentFilter.fromDate ||
          currentFilter.toDate ||
          (currentFilter.search && currentFilter.search.trim() !== '')
      );

      if (!hasActiveFilters) {
        setTotalCount(data.length);
      } else {
        expenseApi.getExpenses().then((all) => setTotalCount(all.length)).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Unable to connect to expense API. Please check server.',
      });
    } finally {
      setIsLoadingExpenses(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadExpenses(filter);
    loadSummary(selectedMonth);
  }, []);

  // Reload expenses whenever filter changes
  useEffect(() => {
    loadExpenses(filter);
  }, [filter, loadExpenses]);

  // Reload summary whenever selectedMonth changes
  useEffect(() => {
    loadSummary(selectedMonth);
  }, [selectedMonth, loadSummary]);

  // Handle Form Submit (Add or Edit)
  const handleFormSubmit = async (formData: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      if (editingExpense) {
        const updated = await expenseApi.updateExpense(editingExpense.id, formData);
        setExpenses((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
        setToast({
          id: Date.now().toString(),
          type: 'success',
          message: `Updated "${updated.title}"`,
        });
      } else {
        const created = await expenseApi.createExpense(formData);
        setExpenses((prev) => [created, ...prev]);
        setTotalCount((prev) => prev + 1);
        setToast({
          id: Date.now().toString(),
          type: 'success',
          message: `Added "${created.title}"`,
        });
      }

      await loadExpenses(filter);
      await loadSummary(selectedMonth);
      setIsFormOpen(false);
      setEditingExpense(null);
    } catch (err: unknown) {
      console.error('Submit error:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;
    const targetExpense = deletingExpense;
    setIsDeleting(true);

    try {
      await expenseApi.deleteExpense(targetExpense.id);
      setExpenses((prev) => prev.filter((e) => e.id !== targetExpense.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setDeletingExpense(null);

      await Promise.all([
        loadExpenses(filter),
        loadSummary(selectedMonth),
      ]);

      setToast({
        id: Date.now().toString(),
        type: 'info',
        message: `Deleted "${targetExpense.title}"`,
        undoLabel: 'Undo',
        undoAction: async () => {
          try {
            await expenseApi.createExpense({
              title: targetExpense.title,
              amount: targetExpense.amount,
              category: targetExpense.category,
              date: targetExpense.date,
              note: targetExpense.note,
            });
            await Promise.all([
              loadExpenses(filter),
              loadSummary(selectedMonth),
            ]);
            setToast({
              id: Date.now().toString(),
              type: 'success',
              message: `Restored "${targetExpense.title}"`,
            });
          } catch (restoreErr) {
            console.error('Failed to undo delete:', restoreErr);
          }
        },
      });
    } catch (err) {
      console.error('Delete error:', err);
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Failed to delete expense',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear all uploaded data
  const handleClearAllConfirm = async () => {
    setIsClearingAll(true);
    try {
      await expenseApi.clearAllExpenses();
      setExpenses([]);
      setTotalCount(0);
      setIsClearAllModalOpen(false);
      await Promise.all([
        loadExpenses(filter),
        loadSummary(selectedMonth),
      ]);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: 'Deleted all uploaded data successfully',
      });
    } catch (err) {
      console.error('Clear all error:', err);
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Failed to delete data',
      });
    } finally {
      setIsClearingAll(false);
    }
  };

  // Reset demo sample data
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await expenseApi.resetDemo();
      await loadExpenses(filter);
      await loadSummary(selectedMonth);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: 'Reset sample expenses to default demo data',
      });
    } catch (err) {
      console.error('Reset error:', err);
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: 'Failed to reset sample data',
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Select category filter
  const handleCategorySelect = (category: ExpenseCategory) => {
    setFilter((prev) => ({
      ...prev,
      category: prev.category === category ? 'All' : category,
    }));
  };

  const handleResetFilters = () => {
    setFilter({
      category: 'All',
      fromDate: undefined,
      toDate: undefined,
      search: '',
    });
  };

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      (filter.category && filter.category !== 'All') ||
        filter.fromDate ||
        filter.toDate ||
        (filter.search && filter.search.trim() !== '')
    );
  }, [filter]);

  return (
    <div className="min-h-screen bg-[#f8f7f5] text-neutral-900 pb-20 selection:bg-amber-100">
      {/* Top Bar with pill tabs */}
      <Header
        onAddExpense={() => {
          setEditingExpense(null);
          setIsFormOpen(true);
        }}
        onResetDemo={handleResetDemo}
        onClearAll={() => setIsClearAllModalOpen(true)}
        isResetting={isResetting}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Page Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-7">
        {/* Flagship Hero: Twin Warm Sunset Cards with Daily Spend Histogram */}
        {(activeTab === 'dashboard' || activeTab === 'categories') && (
          <OverviewHero
            summary={summary}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onAddExpense={() => {
              setEditingExpense(null);
              setIsFormOpen(true);
            }}
            onSelectCategory={handleCategorySelect}
            activeCategory={filter.category}
            isLoading={isLoadingSummary}
          />
        )}

        {/* Filter Toolbar */}
        <ExpenseFilters
          filter={filter}
          onFilterChange={setFilter}
          onResetFilters={handleResetFilters}
          totalCount={totalCount}
          filteredCount={expenses.length}
        />

        {/* Main Content Split (Recent Transactions on Left, Category Grid on Right) */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* Recent Transactions List (7 cols) */}
            <div className="lg:col-span-7">
              <ExpenseList
                expenses={expenses}
                isLoading={isLoadingExpenses}
                onEdit={(expense) => {
                  setEditingExpense(expense);
                  setIsFormOpen(true);
                }}
                onDelete={(expense) => setDeletingExpense(expense)}
                onAddExpense={() => {
                  setEditingExpense(null);
                  setIsFormOpen(true);
                }}
                onResetFilters={handleResetFilters}
                onResetDemo={handleResetDemo}
                hasActiveFilters={hasActiveFilters}
                totalExpensesCount={totalCount}
              />
            </div>

            {/* Spending by Category Grid (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <CategoryGrid
                summary={summary}
                activeCategory={filter.category}
                onSelectCategory={handleCategorySelect}
              />
            </div>
          </div>
        )}

        {/* Dedicated Transactions View */}
        {activeTab === 'transactions' && (
          <div className="max-w-4xl mx-auto">
            <ExpenseList
              expenses={expenses}
              isLoading={isLoadingExpenses}
              onEdit={(expense) => {
                setEditingExpense(expense);
                setIsFormOpen(true);
              }}
              onDelete={(expense) => setDeletingExpense(expense)}
              onAddExpense={() => {
                setEditingExpense(null);
                setIsFormOpen(true);
              }}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              totalExpensesCount={totalCount}
            />
          </div>
        )}

        {/* Dedicated Category Breakdown View */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <CategoryGrid
              summary={summary}
              activeCategory={filter.category}
              onSelectCategory={handleCategorySelect}
            />
            <div className="pt-2">
              <ExpenseList
                expenses={expenses}
                isLoading={isLoadingExpenses}
                onEdit={(expense) => {
                  setEditingExpense(expense);
                  setIsFormOpen(true);
                }}
                onDelete={(expense) => setDeletingExpense(expense)}
                onAddExpense={() => {
                  setEditingExpense(null);
                  setIsFormOpen(true);
                }}
                onResetFilters={handleResetFilters}
                onResetDemo={handleResetDemo}
                hasActiveFilters={hasActiveFilters}
                totalExpensesCount={totalCount}
              />
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Expense Modal */}
      <ExpenseFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingExpense}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingExpense)}
        expense={deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Notification Toast with Undo */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
