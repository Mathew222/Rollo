import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
  ExpenseFormData,
  validateExpense,
} from '../types/expense';
import { getTodayDateString } from '../utils/formatters';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  initialData?: Expense | null;
  isSubmitting?: boolean;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    amount: '',
    category: 'Food',
    date: getTodayDateString(),
    note: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync state when editing or opening
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        amount: initialData.amount.toString(),
        category: initialData.category,
        date: initialData.date,
        note: initialData.note || '',
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        date: getTodayDateString(),
        note: '',
      });
    }
    setErrors({});

    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [initialData, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateExpense(formData);
    if (validationErrors.length > 0) {
      const errMap: Record<string, string> = {};
      validationErrors.forEach((err) => {
        errMap[err.field] = err.message;
      });
      setErrors(errMap);
      return;
    }

    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(String(formData.amount)),
        title: formData.title.trim(),
        note: formData.note?.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save expense';
      setErrors({ form: message });
    }
  };

  const setDateToday = () => {
    setFormData((prev) => ({ ...prev, date: getTodayDateString() }));
  };

  const setDateYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yStr = d.toISOString().split('T')[0];
    setFormData((prev) => ({ ...prev, date: yStr }));
  };

  const isEditing = Boolean(initialData);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-neutral-200/90 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              {isEditing ? 'Edit Expense' : 'Log New Expense'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {isEditing
                ? 'Update expense details below'
                : 'Enter expense information and assign to a category'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {errors.form}
            </div>
          )}

          {/* Title Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="expense-title" className="block text-xs font-semibold text-neutral-700">
                Title <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-neutral-400">
                {formData.title.length}/100
              </span>
            </div>
            <input
              id="expense-title"
              ref={titleInputRef}
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Coffee at Blue Tokai, Metro recharge, Groceries"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              className={`w-full px-3.5 py-2 text-sm bg-neutral-50 border rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:bg-white transition-all ${
                errors.title ? 'border-red-400 focus:ring-red-400' : 'border-neutral-200'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Amount & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount (₹) */}
            <div>
              <label htmlFor="expense-amount" className="block text-xs font-semibold text-neutral-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="w-4 h-4 text-neutral-500 font-bold font-mono text-sm absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  ₹
                </span>
                <input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10000000"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value });
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-sm font-mono tabular-nums bg-neutral-50 border rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:bg-white transition-all ${
                    errors.amount ? 'border-red-400 focus:ring-red-400' : 'border-neutral-200'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-red-600 mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="expense-category" className="block text-xs font-semibold text-neutral-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="expense-category"
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      category: e.target.value as ExpenseCategory,
                    });
                    if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:bg-white cursor-pointer transition-all ${
                    errors.category ? 'border-red-400' : 'border-neutral-200'
                  }`}
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              {errors.category && (
                <p className="text-xs text-red-600 mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Date with quick "Today" and "Yesterday" */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="expense-date" className="block text-xs font-semibold text-neutral-700">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={setDateToday}
                  className="text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
                >
                  Today
                </button>
                <span className="text-neutral-300">&middot;</span>
                <button
                  type="button"
                  onClick={setDateYesterday}
                  className="text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="expense-date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                className={`w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:bg-white transition-all ${
                  errors.date ? 'border-red-400' : 'border-neutral-200'
                }`}
              />
            </div>
            {errors.date && (
              <p className="text-xs text-red-600 mt-1">{errors.date}</p>
            )}
          </div>

          {/* Note (optional, longer text) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="expense-note" className="flex items-center gap-1 text-xs font-semibold text-neutral-700">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span>Note</span>
                <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <span className="text-[11px] text-neutral-400">
                {formData.note ? formData.note.length : 0} / 500
              </span>
            </div>
            <textarea
              id="expense-note"
              rows={3}
              maxLength={500}
              placeholder="Add extra context, receipt notes, or breakdown details..."
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer border border-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-full transition-colors cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                ? 'Save Changes'
                : 'Log Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
