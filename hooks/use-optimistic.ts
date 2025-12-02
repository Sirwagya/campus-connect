'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * Hook for managing optimistic updates with automatic rollback on failure
 */
export function useOptimistic<T>(
  initialValue: T,
  updateFn?: (current: T, optimisticValue: T) => T
) {
  const [value, setValue] = useState(initialValue);
  const [isPending, setIsPending] = useState(false);
  const rollbackRef = useRef<T | null>(null);

  const update = useCallback(
    async (
      optimisticValue: T | ((prev: T) => T),
      asyncFn: () => Promise<void>
    ) => {
      // Store current value for rollback
      rollbackRef.current = value;

      // Apply optimistic update
      const newValue =
        typeof optimisticValue === 'function'
          ? (optimisticValue as (prev: T) => T)(value)
          : updateFn
          ? updateFn(value, optimisticValue)
          : optimisticValue;

      setValue(newValue);
      setIsPending(true);

      try {
        await asyncFn();
        rollbackRef.current = null;
      } catch (error) {
        // Rollback on error
        if (rollbackRef.current !== null) {
          setValue(rollbackRef.current);
          rollbackRef.current = null;
        }
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [value, updateFn]
  );

  const reset = useCallback((newValue: T) => {
    setValue(newValue);
    rollbackRef.current = null;
  }, []);

  return { value, isPending, update, reset, setValue };
}

/**
 * Hook for optimistic list operations (add, update, remove)
 */
export function useOptimisticList<T extends { id: string | number }>(
  initialItems: T[] = []
) {
  const { value: items, isPending, update, reset, setValue } = useOptimistic(initialItems);

  const addItem = useCallback(
    async (item: T, asyncFn: () => Promise<void>) => {
      await update(
        (prev) => [...prev, item],
        asyncFn
      );
    },
    [update]
  );

  const updateItem = useCallback(
    async (id: T['id'], updates: Partial<T>, asyncFn: () => Promise<void>) => {
      await update(
        (prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        asyncFn
      );
    },
    [update]
  );

  const removeItem = useCallback(
    async (id: T['id'], asyncFn: () => Promise<void>) => {
      await update(
        (prev) => prev.filter((item) => item.id !== id),
        asyncFn
      );
    },
    [update]
  );

  const prependItem = useCallback(
    async (item: T, asyncFn: () => Promise<void>) => {
      await update(
        (prev) => [item, ...prev],
        asyncFn
      );
    },
    [update]
  );

  return {
    items,
    isPending,
    addItem,
    updateItem,
    removeItem,
    prependItem,
    reset,
    setItems: setValue,
  };
}

/**
 * Hook for optimistic toggle (like/follow/bookmark)
 */
export function useOptimisticToggle(
  initialState: boolean = false,
  onToggle?: (newState: boolean) => Promise<void>
) {
  const { value: isActive, isPending, update } = useOptimistic(initialState);

  const toggle = useCallback(async () => {
    const newState = !isActive;
    await update(newState, async () => {
      if (onToggle) {
        await onToggle(newState);
      }
    });
  }, [isActive, update, onToggle]);

  return { isActive, isPending, toggle };
}

/**
 * Hook for optimistic counter (likes, comments count)
 */
export function useOptimisticCounter(
  initialCount: number = 0,
  onIncrement?: () => Promise<void>,
  onDecrement?: () => Promise<void>
) {
  const { value: count, isPending, update } = useOptimistic(initialCount);

  const increment = useCallback(async () => {
    await update(count + 1, async () => {
      if (onIncrement) {
        await onIncrement();
      }
    });
  }, [count, update, onIncrement]);

  const decrement = useCallback(async () => {
    await update(Math.max(0, count - 1), async () => {
      if (onDecrement) {
        await onDecrement();
      }
    });
  }, [count, update, onDecrement]);

  return { count, isPending, increment, decrement };
}

/**
 * Hook for optimistic like functionality with count
 */
export function useOptimisticLike(
  initialIsLiked: boolean = false,
  initialCount: number = 0,
  onLike?: () => Promise<void>,
  onUnlike?: () => Promise<void>
) {
  const [state, setState] = useState({
    isLiked: initialIsLiked,
    count: initialCount,
  });
  const [isPending, setIsPending] = useState(false);
  const rollbackRef = useRef<typeof state | null>(null);

  const toggle = useCallback(async () => {
    rollbackRef.current = state;
    
    const newIsLiked = !state.isLiked;
    const newCount = newIsLiked ? state.count + 1 : Math.max(0, state.count - 1);
    
    setState({ isLiked: newIsLiked, count: newCount });
    setIsPending(true);

    try {
      if (newIsLiked && onLike) {
        await onLike();
      } else if (!newIsLiked && onUnlike) {
        await onUnlike();
      }
      rollbackRef.current = null;
    } catch (error) {
      if (rollbackRef.current) {
        setState(rollbackRef.current);
        rollbackRef.current = null;
      }
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [state, onLike, onUnlike]);

  return {
    isLiked: state.isLiked,
    count: state.count,
    isPending,
    toggle,
  };
}
