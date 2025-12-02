'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Toast icons by type
const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success':
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// Toast background colors
const toastStyles: Record<ToastType, string> = {
  success: 'bg-green-900/90 border-green-700',
  error: 'bg-red-900/90 border-red-700',
  warning: 'bg-yellow-900/90 border-yellow-700',
  info: 'bg-blue-900/90 border-blue-700',
};

// Individual Toast component
const ToastItem = ({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) => {
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm ${toastStyles[toast.type]}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <ToastIcon type={toast.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm text-gray-300">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onRemove(toast.id);
            }}
            className="mt-2 text-sm font-medium text-white underline hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

// Toast container that renders all toasts
const ToastContainer = () => {
  const context = useContext(ToastContext);
  if (!context) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {context.toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={context.removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook to use toasts
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    return context.addToast(options);
  }, [context]);

  // Convenience methods
  const success = useCallback((title: string, message?: string) => {
    return context.addToast({ type: 'success', title, message });
  }, [context]);

  const error = useCallback((title: string, message?: string) => {
    return context.addToast({ type: 'error', title, message });
  }, [context]);

  const warning = useCallback((title: string, message?: string) => {
    return context.addToast({ type: 'warning', title, message });
  }, [context]);

  const info = useCallback((title: string, message?: string) => {
    return context.addToast({ type: 'info', title, message });
  }, [context]);

  return {
    toast,
    success,
    error,
    warning,
    info,
    remove: context.removeToast,
    clearAll: context.clearAll,
  };
}

// Promise-based toast for async operations
export function useToastPromise() {
  const { toast, remove } = useToast();

  const promise = useCallback(
    <T,>(
      asyncFn: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: Error) => string);
      }
    ): Promise<T> => {
      const loadingId = toast({
        type: 'info',
        title: options.loading,
        duration: 0, // Don't auto-dismiss
      });

      return asyncFn
        .then((data) => {
          remove(loadingId);
          const message = typeof options.success === 'function' 
            ? options.success(data) 
            : options.success;
          toast({ type: 'success', title: message });
          return data;
        })
        .catch((err) => {
          remove(loadingId);
          const message = typeof options.error === 'function' 
            ? options.error(err) 
            : options.error;
          toast({ type: 'error', title: message });
          throw err;
        });
    },
    [toast, remove]
  );

  return { promise };
}
