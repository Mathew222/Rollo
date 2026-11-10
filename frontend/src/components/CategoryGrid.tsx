import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  Package,
} from 'lucide-react';
import { ExpenseCategory, MonthlySummary } from '../types/expense';
import { formatCurrency, CATEGORY_STYLES } from '../utils/formatters';

interface CategoryGridProps {
  summary: MonthlySummary | null;
  activeCategory: string | undefined;
  onSelectCategory: (category: ExpenseCategory) => void;
}

const CATEGORY_ICONS: Record<ExpenseCategory, React.ReactNode> = {
  Food: <Utensils className="w-5 h-5" />,
  Transport: <Car className="w-5 h-5" />,
  Shopping: <ShoppingBag className="w-5 h-5" />,
  Bills: <Receipt className="w-5 h-5" />,
  Entertainment: <Film className="w-5 h-5" />,
  Other: <Package className="w-5 h-5" />,
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  summary,
  activeCategory,
  onSelectCategory,
}) => {
  const categories = summary?.categories || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-neutral-900 tracking-tight">
            Spending by Category
          </h3>
          <p className="text-xs text-neutral-500">
            Click any category to filter transactions
          </p>
        </div>
        {activeCategory && activeCategory !== 'All' && (
          <button
            type="button"
            onClick={() => onSelectCategory(activeCategory as ExpenseCategory)}
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.category;
          const style = CATEGORY_STYLES[cat.category];
          const icon = CATEGORY_ICONS[cat.category];

          return (
            <button
              key={cat.category}
              type="button"
              onClick={() => onSelectCategory(cat.category)}
              className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[120px] ${
                isSelected
                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-md'
                  : 'bg-white border-neutral-200/80 hover:border-neutral-300 hover:shadow-xs text-neutral-900'
              }`}
            >
              {/* Top row: Label & Icon */}
              <div className="flex items-start justify-between w-full">
                <span
                  className={`text-xs font-semibold truncate ${
                    isSelected ? 'text-white' : 'text-neutral-800'
                  }`}
                >
                  {cat.category}
                </span>
                <div
                  className={`p-2 rounded-xl transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : `${style.bgLight} ${style.textDark}`
                  }`}
                >
                  {icon}
                </div>
              </div>

              {/* Bottom row: Amount & transaction count */}
              <div className="mt-3">
                <div
                  className={`text-lg sm:text-xl font-extrabold font-mono tabular-nums tracking-tight ${
                    isSelected ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {formatCurrency(cat.total)}
                </div>
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-medium mt-0.5 ${
                    isSelected ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  <span>{cat.count} {cat.count === 1 ? 'item' : 'items'}</span>
                  <span>&middot;</span>
                  <span>{cat.percentage}% of month</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
