import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Expense } from '../types/expense';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  expense: Expense | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  expense,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !expense) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-neutral-200/90 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                Delete Expense?
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Are you sure you want to delete this expense record? This will update your monthly totals and category analytics.
              </p>

              {/* Item preview */}
              <div className="mt-3.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs">
                <div className="flex items-center justify-between font-semibold text-neutral-900">
                  <span className="truncate pr-2">{expense.title}</span>
                  <span className="font-mono tabular-nums text-rose-600 shrink-0">
                    -{formatCurrency(expense.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-neutral-500 mt-1">
                  <span>{expense.category}</span>
                  <span>&middot;</span>
                  <span>{formatDate(expense.date).formatted}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 p-1 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer border border-neutral-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-full transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Expense'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
