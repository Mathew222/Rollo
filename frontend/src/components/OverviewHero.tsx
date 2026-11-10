import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Plus,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MonthlySummary, ExpenseCategory } from '../types/expense';
import {
  formatCurrency,
  formatMonthName,
  getCurrentMonthString,
  CATEGORY_STYLES,
} from '../utils/formatters';

interface OverviewHeroProps {
  summary: MonthlySummary | null;
  selectedMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  onAddExpense: () => void;
  onSelectCategory?: (category: ExpenseCategory) => void;
  activeCategory?: string;
  isLoading?: boolean;
}

export const OverviewHero: React.FC<OverviewHeroProps> = ({
  summary,
  selectedMonth,
  onMonthChange,
  onAddExpense,
  onSelectCategory,
  activeCategory,
  isLoading = false,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    date: string;
    total: number;
    count: number;
    xPercent: number;
  } | null>(null);

  const currentMonthStr = getCurrentMonthString();
  const isCurrentMonth = selectedMonth === currentMonthStr;

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${newYear}-${newMonth}`);
  };

  const days = summary?.dailyBreakdown || [];
  const maxDayTotal = Math.max(...days.map((d) => d.total), 50);

  // Format large integer and decimal part for the stylish typography in the reference
  const renderFormattedHeroAmount = (amount: number) => {
    const formatted = formatCurrency(amount);
    const parts = formatted.split('.');
    return (
      <div className="flex items-baseline">
        <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-mono tabular-nums text-white">
          {parts[0]}
        </span>
        {parts[1] && (
          <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono tabular-nums text-white/80">
            .{parts[1]}
          </span>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-4">
      {/* Title & Greeting Banner matching the reference */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2">
        <div>
          <span className="text-xs sm:text-sm font-medium text-neutral-500 tracking-wide block">
            Take control of your finances with real-time insights
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight mt-1">
            Welcome Back, Emma!
          </h1>
        </div>

        {/* Month Selector Pill */}
        <div className="flex items-center gap-1.5 bg-white border border-neutral-200/80 rounded-full px-2.5 py-1.5 shadow-2xs self-start md:self-auto">
          <button
            type="button"
            onClick={() => navigateMonth('prev')}
            className="p-1 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-xs font-semibold text-neutral-800 whitespace-nowrap">
              {formatMonthName(selectedMonth)}
            </span>
            {isCurrentMonth && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Current Month" />
            )}
          </div>
          <button
            type="button"
            onClick={() => navigateMonth('next')}
            className="p-1 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Next month"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Twin Warm Sunset Cards Grid (Directly inspired by reference screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Spending Overview with Interactive Daily Bar Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-[#800f2f] via-[#9e2a2b] to-[#d9534f] text-white shadow-lg border border-red-900/30">
          {/* Subtle decorative glow overlay */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar of Left Card */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-wide text-white/90">
                Overview
              </span>
              <span className="text-xs text-white/60">&middot;</span>
              <span className="text-xs text-white/70">
                {formatMonthName(selectedMonth)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white backdrop-blur-xs border border-white/20">
                {summary?.expenseCount || 0} {summary?.expenseCount === 1 ? 'expense' : 'expenses'}
              </span>
            </div>
          </div>

          {/* Main Figure */}
          <div className="relative z-10 mb-6">
            {isLoading ? (
              <div className="h-12 w-48 bg-white/20 animate-pulse rounded-lg" />
            ) : (
              renderFormattedHeroAmount(summary?.totalSpent || 0)
            )}

            <div className="flex items-center gap-2 mt-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-xs">
                <TrendingUp className="w-3 h-3 text-amber-300" />
                <span>
                  Avg. {formatCurrency(summary?.averageSpent || 0)} / record
                </span>
              </div>
              {summary?.highestCategory && (
                <span className="text-xs text-white/80 hidden sm:inline">
                  Top category: <strong>{summary.highestCategory.category}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Interactive Daily Spending Histogram (matches the vertical bars and tooltip from reference!) */}
          <div className="relative z-10 pt-4">
            {/* Tooltip bubble (matches screenshot's floating bubble with pointer!) */}
            {hoveredDay && hoveredDay.total > 0 && (
              <div
                className="absolute -top-7 -translate-x-1/2 bg-white text-neutral-900 px-3 py-1.5 rounded-xl shadow-xl border border-neutral-100 z-30 pointer-events-none transition-all duration-150 animate-in fade-in"
                style={{
                  left: `${Math.min(Math.max(hoveredDay.xPercent, 12), 88)}%`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold tabular-nums">
                    {formatCurrency(hoveredDay.total)}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    ({hoveredDay.count} {hoveredDay.count === 1 ? 'item' : 'items'})
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 font-medium">
                  {hoveredDay.date}
                </div>
                {/* Pointer tip */}
                <div className="w-2.5 h-2.5 bg-white transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 shadow-xs" />
              </div>
            )}

            {/* Bars container */}
            <div className="h-28 flex items-end justify-between gap-1 sm:gap-1.5 pb-2 border-b border-white/20">
              {days.map((d, index) => {
                const heightPercent =
                  d.total > 0
                    ? Math.max(14, Math.round((d.total / maxDayTotal) * 100))
                    : 6;

                const isHovered = hoveredDay?.day === d.day;
                const hasSpend = d.total > 0;
                const xPercent = (index / (days.length - 1 || 1)) * 100;

                return (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredDay({
                        day: d.day,
                        date: d.date,
                        total: d.total,
                        count: d.count,
                        xPercent,
                      })
                    }
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-200 ${
                        isHovered
                          ? 'bg-white shadow-md'
                          : hasSpend
                          ? 'bg-white/80 hover:bg-white'
                          : 'bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex items-center justify-between text-[10px] text-white/60 font-mono pt-1.5">
              <span>Day 1</span>
              <span>Day 8</span>
              <span>Day 15</span>
              <span>Day 22</span>
              <span>Day {days.length || 30}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Monthly Category Highlights & Quick Action Buttons (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-[#800f2f] via-[#9e2a2b] to-[#d9534f] text-white shadow-lg border border-red-900/30 flex flex-col justify-between">
          <div className="relative z-10">
            {/* Top Bar of Right Card */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-wide text-white/90">
                  Category Breakdown
                </span>
              </div>
              <span className="text-[11px] font-medium text-white/70 bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                Top Categories
              </span>
            </div>

            {/* Highest Category Metric */}
            <div className="mb-5">
              <span className="text-xs text-white/70 block">
                Highest Spending Category
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {summary?.highestCategory?.category || 'None Yet'}
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
                  {formatCurrency(summary?.highestCategory?.total || 0)}
                </div>
              </div>
              {summary?.highestCategory && (
                <span className="text-[11px] text-amber-200 font-medium block mt-0.5">
                  {summary.highestCategory.percentage}% of this month&apos;s total spending
                </span>
              )}
            </div>

            {/* Category Stack Bars (Top 3 or 4) */}
            <div className="space-y-2.5 mb-6">
              {summary?.categories
                .filter((cat) => cat.percentage > 0)
                .slice(0, 4)
                .map((cat) => {
                  const isSelected = activeCategory === cat.category;
                  return (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => onSelectCategory?.(cat.category)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-neutral-900 shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="truncate">{cat.category}</span>
                        <span className="font-mono tabular-nums">
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isSelected ? 'bg-amber-500' : 'bg-white'
                          }`}
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}

              {(!summary || summary.totalSpent === 0) && (
                <div className="py-5 px-4 rounded-2xl bg-white/10 text-center border border-white/15">
                  <p className="text-xs text-white/90 font-medium">
                    No expenses recorded for {formatMonthName(selectedMonth)}.
                  </p>
                  <p className="text-[11px] text-white/70 mt-1">
                    Track your daily spending to see category breakdowns.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Pill Buttons (Styled like "Deposit" / "Withdraw" pill buttons in screenshot) */}
          <div className="grid grid-cols-2 gap-3 relative z-10 pt-2 border-t border-white/20">
            <button
              type="button"
              onClick={onAddExpense}
              className="w-full py-2.5 px-4 bg-white text-neutral-900 hover:bg-neutral-100 rounded-full text-xs font-bold tracking-tight shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-neutral-900" />
              <span>Add Expense</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectCategory?.('Food')}
              className="w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-bold tracking-tight border border-white/25 backdrop-blur-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>View Food</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
