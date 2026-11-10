import React from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';

interface HeaderProps {
  onAddExpense: () => void;
  onResetDemo: () => void;
  onClearAll?: () => void;
  isResetting?: boolean;
  activeTab?: 'dashboard' | 'transactions' | 'categories';
  onTabChange?: (tab: 'dashboard' | 'transactions' | 'categories') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onAddExpense,
  onResetDemo,
  onClearAll,
  isResetting = false,
  activeTab = 'dashboard',
  onTabChange,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#f8f7f5]/90 backdrop-blur-md border-b border-neutral-200/60 px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-sm font-bold text-lg font-mono">
            ₹
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-neutral-900 block leading-tight">
              Rollo <span className="text-neutral-400 font-normal">Expense Tracker</span>
            </span>
            <span className="text-[11px] text-neutral-500 hidden sm:block">Personal Expense Studio &middot; INR</span>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs (Pill style matching reference image) */}
        <nav className="hidden md:flex items-center bg-white/80 p-1 rounded-full border border-neutral-200/70 shadow-xs">
          <button
            type="button"
            onClick={() => onTabChange?.('dashboard')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onTabChange?.('transactions')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            All Transactions
          </button>
          <button
            type="button"
            onClick={() => onTabChange?.('categories')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Category Breakdown
          </button>
        </nav>

        {/* Zone 3: Actions + User Profile */}
        <div className="flex items-center gap-2.5">
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              title="Delete all uploaded data"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full border border-rose-200/80 transition-colors cursor-pointer bg-white/60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete All Data</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetDemo}
            disabled={isResetting}
            title="Reset to default sample data"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-full border border-neutral-200/80 transition-colors cursor-pointer bg-white/60"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Demo Data'}</span>
          </button>

          <button
            type="button"
            onClick={onAddExpense}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-full shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-1 border-l border-neutral-200/70 ml-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-white shadow-xs">
              E
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
