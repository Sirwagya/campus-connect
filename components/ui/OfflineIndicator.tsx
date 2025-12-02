'use client';

import { useCallback, useReducer, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

// State machine for online/offline status
type State = {
  status: 'online' | 'offline' | 'reconnected';
};

type Action = 
  | { type: 'GO_OFFLINE' }
  | { type: 'GO_ONLINE' }
  | { type: 'HIDE_RECONNECTED' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'GO_OFFLINE':
      return { status: 'offline' };
    case 'GO_ONLINE':
      if (state.status === 'offline') {
        return { status: 'reconnected' };
      }
      return state;
    case 'HIDE_RECONNECTED':
      return { status: 'online' };
    default:
      return state;
  }
}

/**
 * Hook for online status using event listeners
 */
function useNetworkStatus() {
  const initialOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [state, dispatch] = useReducer(reducer, { 
    status: initialOnline ? 'online' : 'offline' 
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOnline = useCallback(() => {
    dispatch({ type: 'GO_ONLINE' });
    // Auto-hide reconnected message after 3 seconds
    timerRef.current = setTimeout(() => {
      dispatch({ type: 'HIDE_RECONNECTED' });
    }, 3000);
  }, []);

  const handleOffline = useCallback(() => {
    dispatch({ type: 'GO_OFFLINE' });
    // Clear any pending timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [handleOnline, handleOffline]);

  return state;
}

/**
 * Offline indicator banner component
 * Shows a banner when offline and a brief "reconnected" message when back online
 */
export function OfflineIndicator() {
  const { status } = useNetworkStatus();

  return (
    <AnimatePresence>
      {status === 'offline' && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-3"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-5 w-5" />
            <span className="font-medium">You&apos;re offline</span>
            <span className="text-sm opacity-90">Some features may be unavailable</span>
          </div>
        </motion.div>
      )}

      {status === 'reconnected' && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-3"
        >
          <div className="flex items-center justify-center gap-2">
            <Wifi className="h-5 w-5" />
            <span className="font-medium">Back online!</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Minimal offline indicator - just a small badge
 */
export function OfflineBadge() {
  const { status } = useNetworkStatus();

  if (status === 'online') return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={`
        fixed bottom-20 right-4 z-50 rounded-full px-3 py-1.5 
        flex items-center gap-1.5 text-sm shadow-lg
        ${status === 'offline' 
          ? 'bg-destructive text-destructive-foreground' 
          : 'bg-green-500 text-white'}
      `}
    >
      {status === 'offline' ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" />
          <span>Connected</span>
        </>
      )}
    </motion.div>
  );
}

/**
 * Hook to check if currently online
 */
export function useIsOnline() {
  const { status } = useNetworkStatus();
  return status !== 'offline';
}
