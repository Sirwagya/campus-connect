'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  /** Threshold in pixels from the bottom to trigger load more */
  threshold?: number;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether currently loading */
  isLoading: boolean;
  /** Callback to load more items */
  onLoadMore: () => void;
  /** Optional root element (defaults to viewport) */
  root?: HTMLElement | null;
}

/**
 * Hook for implementing infinite scroll functionality
 */
export function useInfiniteScroll({
  threshold = 200,
  hasMore,
  isLoading,
  onLoadMore,
  root = null,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        root,
        rootMargin: `0px 0px ${threshold}px 0px`,
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, onLoadMore, root, threshold]);

  return { sentinelRef };
}

interface UseInfinitePaginationOptions<T> {
  /** Fetch function that returns items for a page */
  fetchFn: (page: number) => Promise<T[]>;
  /** Number of items per page */
  pageSize?: number;
  /** Initial data (optional) */
  initialData?: T[];
}

interface UseInfinitePaginationResult<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  refresh: () => Promise<void>;
  sentinelRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for paginated data fetching with infinite scroll
 */
export function useInfinitePagination<T>({
  fetchFn,
  pageSize = 10,
  initialData = [],
}: UseInfinitePaginationOptions<T>): UseInfinitePaginationResult<T> {
  const [items, setItems] = useState<T[]>(initialData);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const newItems = await fetchFn(page + 1);
      
      if (newItems.length < pageSize) {
        setHasMore(false);
      }

      setItems((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchFn, page, pageSize, isLoading, isLoadingMore, hasMore]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPage(1);
    setHasMore(true);

    try {
      const newItems = await fetchFn(1);
      
      if (newItems.length < pageSize) {
        setHasMore(false);
      }

      setItems(newItems);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, pageSize]);

  // Initial load
  useEffect(() => {
    if (initialData.length === 0) {
      refresh();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoading || isLoadingMore,
    onLoadMore: loadMore,
  });

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    sentinelRef: sentinelRef as React.RefObject<HTMLDivElement>,
  };
}

/**
 * Loading indicator for infinite scroll
 */
export function InfiniteScrollLoader({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <div className="flex justify-center py-4">
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm">Loading more...</span>
      </div>
    </div>
  );
}

/**
 * End of list indicator
 */
export function EndOfList({ message = "You've reached the end" }: { message?: string }) {
  return (
    <div className="flex justify-center py-6">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

/**
 * Sentinel element that triggers loading when visible
 */
export function InfiniteScrollSentinel({
  sentinelRef,
  hasMore,
  isLoading,
  endMessage,
}: {
  sentinelRef: React.RefObject<HTMLDivElement>;
  hasMore: boolean;
  isLoading: boolean;
  endMessage?: string;
}) {
  return (
    <>
      <div ref={sentinelRef} className="h-1" />
      {isLoading && <InfiniteScrollLoader isLoading />}
      {!hasMore && !isLoading && <EndOfList message={endMessage} />}
    </>
  );
}
