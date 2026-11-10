import React from 'react';
import { Search, X, Calendar, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { EXPENSE_CATEGORIES, ExpenseCategory, ExpenseFilter } from '../types/expense';

interface ExpenseFiltersProps {
  filter: ExpenseFilter;
  onFilterChange: (newFilter: ExpenseFilter) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  filter,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
}) => {
  const isWeirdDateRange = Boolean(
    filter.fromDate &&
      filter.toDate &&
      new Date(filter.fromDate) > new Date(filter.toDate)
  );

  const hasActiveFilters = Boolean(
    (filter.category && filter.category !== 'All') ||
      filter.fromDate ||
      filter.toDate ||
      (filter.search && filter.search.trim() !== '')
  );

  const handleSwapDates = () => {
    onFilterChange({
      ...filter,
      fromDate: filter.toDate,
      toDate: filter.fromDate,
    });
  };

  const handlePreset = (preset: 'all' | 'this_month' | 'last_30_days') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      onFilterChange({
        ...filter,
        fromDate: undefined,
        toDate: undefined,
      });
    } else if (preset === 'this_month') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const firstDay = `${year}-${month}-01`;
      onFilterChange({
        ...filter,
        fromDate: firstDay,
        toDate: todayStr,
      });
    } else if (preset === 'last_30_days') {
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      const pastStr = past.toISOString().split('T')[0];
      onFilterChange({
        ...filter,
        fromDate: pastStr,
        toDate: todayStr,
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 p-4 sm:p-5 shadow-xs space-y-3">
      {/* Search & Category Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.search || ''}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            placeholder="Search by title or note..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-neutral-50/80 border border-neutral-200/90 rounded-full text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:bg-white transition-all"
          />
          {filter.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filter, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills & Clear */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-neutral-100/80 p-1 rounded-full">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filter, category: 'All' })}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                !filter.category || filter.category === 'All'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All
            </button>
            {EXPENSE_CATEGORIES.map((cat) => {
              const isSelected = filter.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onFilterChange({ ...filter, category: cat })}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-full border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0 ml-1"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Range & Counter */}
      <div className="pt-2.5 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-neutral-500 font-medium mr-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Range:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              aria-label="From date"
              value={filter.fromDate || ''}
              onChange={(e) => onFilterChange({ ...filter, fromDate: e.target.value || undefined })}
              className={`px-2.5 py-1 text-xs bg-neutral-50 border rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800 ${
                isWeirdDateRange ? 'border-amber-400 bg-amber-50/50' : 'border-neutral-200'
              }`}
            />
            <span className="text-neutral-400">&rarr;</span>
            <input
              type="date"
              aria-label="To date"
              value={filter.toDate || ''}
              onChange={(e) => onFilterChange({ ...filter, toDate: e.target.value || undefined })}
              className={`px-2.5 py-1 text-xs bg-neutral-50 border rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800 ${
                isWeirdDateRange ? 'border-amber-400 bg-amber-50/50' : 'border-neutral-200'
              }`}
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={() => handlePreset('this_month')}
              className="px-2 py-0.5 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handlePreset('last_30_days')}
              className="px-2 py-0.5 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => handlePreset('all')}
              className="px-2 py-0.5 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              All Time
            </button>
          </div>
        </div>

        <div className="text-neutral-500 font-medium">
          Showing <span className="font-bold text-neutral-900">{filteredCount}</span> of {totalCount}
        </div>
      </div>

      {/* Weird date range warning with 1-click swap */}
      {isWeirdDateRange && (
        <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              &quot;From&quot; date ({filter.fromDate}) is after &quot;To&quot; date ({filter.toDate}).
            </span>
          </div>
          <button
            type="button"
            onClick={handleSwapDates}
            className="flex items-center gap-1 px-3 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-semibold rounded-full transition-colors cursor-pointer shrink-0"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Swap Dates</span>
          </button>
        </div>
      )}
    </div>
  );
};
