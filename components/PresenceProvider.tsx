'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';

type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

interface PresenceContextValue {
  status: PresenceStatus;
  customStatus: string | null;
  setStatus: (status: PresenceStatus) => Promise<void>;
  setCustomStatus: (status: string | null) => Promise<void>;
  isUpdating: boolean;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function usePresenceContext() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresenceContext must be used within a PresenceProvider');
  }
  return context;
}

interface PresenceProviderProps {
  children: ReactNode;
}

export function PresenceProvider({ children }: PresenceProviderProps) {
  const { user } = useAuth();
  const [status, setStatusState] = useState<PresenceStatus>('offline');
  const [customStatus, setCustomStatusState] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePresence = useCallback(async (newStatus: PresenceStatus, newCustomStatus?: string | null) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (newCustomStatus !== undefined) {
        body.custom_status = newCustomStatus;
      }
      
      const response = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        setStatusState(newStatus);
        if (newCustomStatus !== undefined) {
          setCustomStatusState(newCustomStatus);
        }
      }
    } catch {
      // Silently ignore presence update errors - they're non-critical
    } finally {
      setIsUpdating(false);
    }
  }, [user]);

  const setStatus = useCallback(async (newStatus: PresenceStatus) => {
    await updatePresence(newStatus);
  }, [updatePresence]);

  const setCustomStatus = useCallback(async (newCustomStatus: string | null) => {
    await updatePresence(status, newCustomStatus);
  }, [updatePresence, status]);

  // Auto-manage presence based on user auth and page visibility
  useEffect(() => {
    if (!user) {
      setStatusState('offline');
      return;
    }

    // Set online when component mounts (user is authenticated)
    updatePresence('online');

    // Handle visibility changes - debounced
    let visibilityDebounce: NodeJS.Timeout;
    const handleVisibilityChange = () => {
      clearTimeout(visibilityDebounce);
      visibilityDebounce = setTimeout(() => {
        if (document.hidden) {
          updatePresence('away');
        } else {
          updatePresence('online');
        }
      }, 1000); // 1 second debounce
    };

    // Handle page unload - use sendBeacon for reliability
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/presence', JSON.stringify({ status: 'offline' }));
    };

    // Handle user activity for "away" detection - heavily debounced
    let activityTimeout: NodeJS.Timeout;
    let activityDebounce: NodeJS.Timeout;
    const resetActivityTimer = () => {
      clearTimeout(activityDebounce);
      activityDebounce = setTimeout(() => {
        clearTimeout(activityTimeout);
        // Only update if we were away
        setStatusState(prev => {
          if (prev === 'away' && !document.hidden) {
            updatePresence('online');
          }
          return prev;
        });
        activityTimeout = setTimeout(() => {
          if (!document.hidden) {
            setStatusState(prev => {
              if (prev === 'online') {
                updatePresence('away');
              }
              return prev;
            });
          }
        }, 5 * 60 * 1000); // 5 minutes of inactivity
      }, 2000); // 2 second debounce for activity
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('mousemove', resetActivityTimer, { passive: true });
    document.addEventListener('keydown', resetActivityTimer, { passive: true });
    document.addEventListener('click', resetActivityTimer, { passive: true });
    document.addEventListener('scroll', resetActivityTimer, { passive: true });

    // Start activity timer
    resetActivityTimer();

    return () => {
      clearTimeout(activityTimeout);
      clearTimeout(activityDebounce);
      clearTimeout(visibilityDebounce);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mousemove', resetActivityTimer);
      document.removeEventListener('keydown', resetActivityTimer);
      document.removeEventListener('click', resetActivityTimer);
      document.removeEventListener('scroll', resetActivityTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user, not status or updatePresence

  // Heartbeat to keep presence alive (every 2 minutes)
  useEffect(() => {
    if (!user || status === 'offline') return;

    const heartbeat = setInterval(() => {
      updatePresence(status);
    }, 2 * 60 * 1000);

    return () => clearInterval(heartbeat);
  }, [user, status, updatePresence]);

  return (
    <PresenceContext.Provider 
      value={{ 
        status, 
        customStatus, 
        setStatus, 
        setCustomStatus, 
        isUpdating 
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}
