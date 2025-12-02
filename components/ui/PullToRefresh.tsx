'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  /** Threshold in pixels to trigger refresh */
  threshold?: number;
  /** Whether refresh is disabled */
  disabled?: boolean;
  /** Custom loading indicator */
  loadingIndicator?: React.ReactNode;
  /** Background color during pull */
  backgroundColor?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
  loadingIndicator,
  backgroundColor = 'transparent',
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;

      const container = containerRef.current;
      if (!container) return;

      // Only start if at the top of scroll
      if (container.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        isDragging.current = true;
      }
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current || isRefreshing) return;

      const container = containerRef.current;
      if (!container || container.scrollTop > 0) {
        isDragging.current = false;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);

      // Apply resistance to pull
      const resistance = 0.5;
      const resistedDistance = distance * resistance;

      if (resistedDistance > 0) {
        e.preventDefault();
        setPullDistance(resistedDistance);
        setCanRefresh(resistedDistance >= threshold);
      }
    },
    [threshold, isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setCanRefresh(false);
      }
    } else {
      setPullDistance(0);
      setCanRefresh(false);
    }
  }, [canRefresh, isRefreshing, onRefresh, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull indicator */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: pullDistance }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden z-10"
        style={{ backgroundColor }}
      >
        {loadingIndicator || (
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={{
                rotate: isRefreshing ? 360 : progress * 180,
              }}
              transition={{
                duration: isRefreshing ? 1 : 0,
                repeat: isRefreshing ? Infinity : 0,
                ease: 'linear',
              }}
              className="w-6 h-6"
            >
              <svg
                className={`w-full h-full ${
                  canRefresh || isRefreshing ? 'text-primary' : 'text-gray-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </motion.div>
            <span className="text-xs text-gray-400">
              {isRefreshing
                ? 'Refreshing...'
                : canRefresh
                ? 'Release to refresh'
                : 'Pull to refresh'}
            </span>
          </div>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        animate={{ y: pullDistance }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Hook for pull-to-refresh logic (for custom implementations)
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const canRefresh = pullDistance >= threshold;
  const progress = Math.min(pullDistance / threshold, 1);

  const handlers = {
    onTouchStart: (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    },

    onTouchMove: (e: React.TouchEvent) => {
      if (!isDragging.current || isRefreshing || disabled) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);
      const resistedDistance = distance * 0.5;

      if (resistedDistance > 0) {
        setPullDistance(resistedDistance);
      }
    },

    onTouchEnd: async () => {
      if (!isDragging.current) return;
      isDragging.current = false;

      if (canRefresh && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setPullDistance(0);
    },
  };

  return {
    pullDistance,
    isRefreshing,
    canRefresh,
    progress,
    handlers,
  };
}
