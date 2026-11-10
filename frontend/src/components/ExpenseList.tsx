import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  Inbox,
  FilterX,
  Plus,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  Package,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../types/expense';
import {
  formatCurrency,
  formatDate,
  CATEGORY_STYLES,
} from '../utils/formatters';

interface ExpenseListProps {
  expenses: Expense[];
  isLoading?: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onAddExpense: () => void;
  onResetFilters: () => void;
  onResetDemo?: () => void;
  hasActiveFilters: boolean;
  totalExpensesCount: number;
}

const CATEGORY_ICONS: Record<ExpenseCategory, React.ReactNode> = {
  Food: <Utensils className="w-4 h-4" />,
  Transport: <Car className="w-4 h-4" />,
  Shopping: <ShoppingBag className="w-4 h-4" />,
  Bills: <Receipt className="w-4 h-4" />,
  Entertainment: <Film className="w-4 h-4" />,
  Other: <Package className="w-4 h-4" />,
};

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  isLoading = false,
  onEdit,
  onDelete,
  onAddExpense,
  onResetFilters,
  onResetDemo,
  hasActiveFilters,
  totalExpensesCount,
}) => {
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const toggleNote = (id: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-7 shadow-xs">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-neutral-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-neutral-200 rounded" />
                  <div className="h-3 w-20 bg-neutral-200 rounded" />
                </div>
              </div>
              <div className="h-5 w-20 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Edge case 1: Empty state when no expenses exist in the system at all
  if (totalExpensesCount === 0) {
    return (
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-10 sm:p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3.5 border border-amber-100">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-neutral-900">
          No expenses recorded yet
        </h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
          Start tracking your daily expenses in Indian Rupee (₹) to see category breakdowns and real-time monthly charts.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onAddExpense}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-full transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Expense</span>
          </button>
          {onResetDemo && (
            <button
              type="button"
              onClick={onResetDemo}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-full transition-colors cursor-pointer border border-neutral-200"
            >
              <span>Load Sample Data (₹)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Edge case 2: Empty state when filters yield zero matching expenses
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-10 sm:p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-500 mx-auto flex items-center justify-center mb-3.5">
          <FilterX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-neutral-900">
          No matching transactions found
        </h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
          No records match your active search and date filters. Try widening your date range or clearing category filters.
        </p>
        {hasActiveFilters && (
          <div className="mt-5">
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-full transition-colors cursor-pointer border border-neutral-200"
            >
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-7 shadow-xs">
      {/* Header matching reference */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div>
          <h3 className="text-base font-bold text-neutral-900 tracking-tight">
            Recent Transactions
          </h3>
          <p className="text-xs text-neutral-500">
            Sorted by date (most recent first) &middot; Showing {expenses.length} records
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
          >
            View All
          </button>
        )}
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-neutral-100">
        {expenses.map((expense) => {
          const { formatted, relative } = formatDate(expense.date);
          const style = CATEGORY_STYLES[expense.category] || CATEGORY_STYLES.Other;
          const icon = CATEGORY_ICONS[expense.category] || <Receipt className="w-4 h-4" />;
          const isNoteExpanded = Boolean(expandedNotes[expense.id]);
          const hasNote = Boolean(expense.note && expense.note.trim() !== '');

          return (
            <div
              key={expense.id}
              className="py-4 hover:bg-neutral-50/70 rounded-2xl px-2 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3.5">
                {/* Left: Round icon circle + Title & Metadata */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border mt-0.5 shadow-2xs ${style.bgLight} ${style.borderLight} ${style.textDark}`}
                  >
                    {icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900 truncate">
                        {expense.title}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.bgLight} ${style.borderLight} ${style.textDark}`}
                      >
                        {expense.category}
                      </span>
                    </div>

                    {/* Date line */}
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                      <span className="font-medium text-neutral-700">{formatted}</span>
                      {relative && (
                        <>
                          <span>&middot;</span>
                          <span className="text-neutral-400 italic">{relative}</span>
                        </>
                      )}
                    </div>

                    {/* Note preview if provided */}
                    {hasNote && (
                      <div className="mt-2 text-xs text-neutral-600 bg-neutral-50 rounded-xl p-2.5 border border-neutral-100">
                        <div className="flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`whitespace-pre-line leading-relaxed ${
                                !isNoteExpanded && expense.note!.length > 100
                                  ? 'line-clamp-2'
                                  : ''
                              }`}
                            >
                              {expense.note}
                            </p>
                            {expense.note!.length > 100 && (
                              <button
                                type="button"
                                onClick={() => toggleNote(expense.id)}
                                className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 mt-1 flex items-center gap-0.5 cursor-pointer"
                              >
                                {isNoteExpanded ? (
                                  <>
                                    <span>Show less</span>
                                    <ChevronUp className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    <span>Show more</span>
                                    <ChevronDown className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Negative Amount in Red + Edit/Delete on Hover */}
                <div className="flex items-center gap-3 shrink-0 pt-0.5">
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-rose-600 tabular-nums block">
                      -{formatCurrency(expense.amount)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEdit(expense)}
                      className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/70 transition-colors cursor-pointer"
                      title="Edit expense"
                      aria-label={`Edit ${expense.title}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(expense)}
                      className="p-1.5 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete expense"
                      aria-label={`Delete ${expense.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
