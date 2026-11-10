import React, { useEffect } from 'react';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
  undoAction?: () => void;
  undoLabel?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="bg-neutral-900 text-white rounded-lg px-4 py-3 shadow-lg flex items-center justify-between gap-3 text-xs border border-neutral-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toast.message}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {toast.undoAction && (
            <button
              type="button"
              onClick={() => {
                toast.undoAction?.();
                onClose();
              }}
              className="flex items-center gap-1 font-semibold text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{toast.undoLabel || 'Undo'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
