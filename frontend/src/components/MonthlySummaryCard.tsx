import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { ExpenseCategory, MonthlySummary } from '../types/expense';
import {
  formatCurrency,
  formatMonthName,
  getCurrentMonthString,
  CATEGORY_STYLES,
} from '../utils/formatters';

interface MonthlySummaryCardProps {
  summary: MonthlySummary | null;
  selectedMonth: string; // YYYY-MM
  onMonthChange: (newMonth: string) => void;
  onSelectCategory?: (category: ExpenseCategory) => void;
  activeCategoryFilter?: string;
  isLoading?: boolean;
}

export const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = ({
  summary,
  selectedMonth,
  onMonthChange,
  onSelectCategory,
  activeCategoryFilter,
  isLoading = false,
}) => {
  const currentMonthStr = getCurrentMonthString();
  const isCurrentMonth = selectedMonth === currentMonthStr;

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${newYear}-${newMonth}`);
  };

  const goToCurrentMonth = () => {
    onMonthChange(currentMonthStr);
  };

  return (
    <section className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-6 shadow-xs">
      {/* Month Navigator Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-100 text-neutral-700">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
                {formatMonthName(selectedMonth)}
              </h2>
              {isCurrentMonth ? (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Current Month
                </span>
              ) : (
                <button
                  type="button"
                  onClick={goToCurrentMonth}
                  className="text-[11px] font-medium text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
                >
                  Return to current
                </button>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Monthly spending totals and category breakdown
            </p>
          </div>
        </div>

        {/* Month Navigation Buttons */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => navigateMonth('prev')}
            className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-white transition-colors cursor-pointer"
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-mono font-medium text-neutral-700 tabular-nums">
            {selectedMonth}
          </span>
          <button
            type="button"
            onClick={() => navigateMonth('next')}
            className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-white transition-colors cursor-pointer"
            title="Next month"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
          <span className="text-xs">Calculating monthly summary...</span>
        </div>
      ) : summary ? (
        <div className="pt-5 space-y-6">
          {/* Primary High-Level Spend KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
              <span className="text-xs font-medium text-neutral-500">Total Spent</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums mt-1">
                {formatCurrency(summary.totalSpent)}
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Across {summary.expenseCount} {summary.expenseCount === 1 ? 'transaction' : 'transactions'}
              </span>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
              <span className="text-xs font-medium text-neutral-500">Average / Transaction</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums mt-1">
                {formatCurrency(summary.averageSpent)}
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Per expense record
              </span>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
              <span className="text-xs font-medium text-neutral-500">Top Category</span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1 truncate">
                {summary.highestCategory ? summary.highestCategory.category : 'None'}
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                {summary.highestCategory
                  ? `${formatCurrency(summary.highestCategory.total)} (${summary.highestCategory.percentage}%)`
                  : 'No spending recorded yet'}
              </span>
            </div>
          </div>

          {/* Category Breakdown Progress Bar */}
          {summary.totalSpent > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span className="font-medium">Spending Distribution</span>
                <span className="text-neutral-400">100% Total</span>
              </div>
              <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden flex">
                {summary.categories
                  .filter((cat) => cat.percentage > 0)
                  .map((cat) => {
                    const style = CATEGORY_STYLES[cat.category];
                    return (
                      <div
                        key={cat.category}
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: style.color,
                        }}
                        className="h-full transition-all duration-300 hover:opacity-85"
                        title={`${cat.category}: ${formatCurrency(cat.total)} (${cat.percentage}%)`}
                      />
                    );
                  })}
              </div>
            </div>
          )}

          {/* Category Breakdown Table / Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
              <span>Category Breakdown</span>
              <span>Spent &middot; % of Month</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {summary.categories.map((cat) => {
                const style = CATEGORY_STYLES[cat.category];
                const isSelected = activeCategoryFilter === cat.category;

                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => onSelectCategory && onSelectCategory(cat.category)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isSelected ? 'bg-white' : style.dotColor
                        }`}
                      />
                      <div className="truncate">
                        <div className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                          {cat.category}
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {cat.count} {cat.count === 1 ? 'expense' : 'expenses'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className={`text-sm font-mono font-semibold tabular-nums ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                        {formatCurrency(cat.total)}
                      </div>
                      <div className={`text-xs font-mono tabular-nums ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {cat.percentage}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-neutral-500">
          No spending records found for {formatMonthName(selectedMonth)}.
        </div>
      )}
    </section>
  );
};
