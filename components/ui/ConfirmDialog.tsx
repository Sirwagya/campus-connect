'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, HelpCircle, Trash2 } from 'lucide-react';
import { Button } from './Button';

// Types
type DialogVariant = 'default' | 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: ReactNode;
}

interface DialogState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmDelete: (itemName: string) => Promise<boolean>;
  close: () => void;
}

// Context
const ConfirmContext = createContext<ConfirmContextType | null>(null);

// Hook
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context;
}

// Variant styles
const variantStyles: Record<DialogVariant, {
  icon: ReactNode;
  iconBg: string;
  buttonVariant: 'default' | 'destructive';
}> = {
  default: {
    icon: <HelpCircle className="h-6 w-6 text-blue-500" />,
    iconBg: 'bg-blue-500/10',
    buttonVariant: 'default',
  },
  danger: {
    icon: <Trash2 className="h-6 w-6 text-red-500" />,
    iconBg: 'bg-red-500/10',
    buttonVariant: 'destructive',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    iconBg: 'bg-yellow-500/10',
    buttonVariant: 'default',
  },
  info: {
    icon: <Info className="h-6 w-6 text-blue-500" />,
    iconBg: 'bg-blue-500/10',
    buttonVariant: 'default',
  },
};

// Provider component
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        ...options,
        resolve,
      });
    });
  }, []);

  const confirmDelete = useCallback((itemName: string): Promise<boolean> => {
    return confirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
  }, [confirm]);

  const handleConfirm = useCallback(() => {
    dialogState.resolve?.(true);
    setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    dialogState.resolve?.(false);
    setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [dialogState]);

  const close = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  const variant = dialogState.variant || 'default';
  const styles = variantStyles[variant];

  return (
    <ConfirmContext.Provider value={{ confirm, confirmDelete, close }}>
      {children}
      <AnimatePresence>
        {dialogState.isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={handleCancel}
            />
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-card border border-border rounded-lg shadow-xl p-6">
                {/* Icon */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full ${styles.iconBg}`}>
                    {dialogState.icon || styles.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {dialogState.title}
                    </h2>
                  </div>
                </div>

                {/* Message */}
                <p className="text-muted-foreground mb-6 ml-[60px]">
                  {dialogState.message}
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={handleCancel}>
                    {dialogState.cancelText || 'Cancel'}
                  </Button>
                  <Button
                    variant={styles.buttonVariant}
                    onClick={handleConfirm}
                  >
                    {dialogState.confirmText || 'Confirm'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

/**
 * Standalone confirm dialog component (for use without provider)
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-lg shadow-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${styles.iconBg}`}>
                  {styles.icon}
                </div>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              </div>
              <p className="text-muted-foreground mb-6 ml-[60px]">{message}</p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  {cancelText}
                </Button>
                <Button
                  variant={styles.buttonVariant}
                  onClick={onConfirm}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
