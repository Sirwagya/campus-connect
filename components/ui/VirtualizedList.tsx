'use client';

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';

interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the container in pixels */
  containerHeight: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Number of items to render above/below visible area */
  overscan?: number;
  /** Unique key extractor for items */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Optional className for the container */
  className?: string;
  /** Callback when scrolling near the end */
  onEndReached?: () => void;
  /** Threshold for triggering onEndReached (in pixels from bottom) */
  endReachedThreshold?: number;
}

/**
 * Virtualized list component for rendering large lists efficiently
 * Only renders items that are visible in the viewport
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  keyExtractor,
  className = '',
  onEndReached,
  endReachedThreshold = 200,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const endReachedCalledRef = useRef(false);

  // Calculate visible range
  const { startIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1),
    };
  }, [scrollTop, itemHeight, containerHeight, items, overscan]);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for the visible items
  const offsetY = startIndex * itemHeight;

  // Handle scroll
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      setScrollTop(target.scrollTop);

      // Check if near end
      if (onEndReached) {
        const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
        if (scrollBottom < endReachedThreshold && !endReachedCalledRef.current) {
          endReachedCalledRef.current = true;
          onEndReached();
        } else if (scrollBottom >= endReachedThreshold) {
          endReachedCalledRef.current = false;
        }
      }
    },
    [onEndReached, endReachedThreshold]
  );

  // Reset end reached flag when items change
  useEffect(() => {
    endReachedCalledRef.current = false;
  }, [items.length]);

  // Get key for item
  const getKey = useCallback(
    (item: T, index: number) => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      return startIndex + index;
    },
    [keyExtractor, startIndex]
  );

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Spacer to maintain scroll height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items positioned absolutely */}
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={getKey(item, index)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface VirtualizedGridProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Width of each item in pixels (or 'auto' for responsive) */
  itemWidth: number | 'auto';
  /** Height of the container in pixels */
  containerHeight: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Number of columns (auto-calculated if not provided) */
  columns?: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Number of rows to render above/below visible area */
  overscan?: number;
  /** Unique key extractor for items */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Optional className for the container */
  className?: string;
}

/**
 * Virtualized grid component for rendering large grids efficiently
 */
export function VirtualizedGrid<T>({
  items,
  itemHeight,
  itemWidth,
  containerHeight,
  renderItem,
  columns: columnsProp,
  gap = 16,
  overscan = 2,
  keyExtractor,
  className = '',
}: VirtualizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate columns
  const columns = useMemo(() => {
    if (columnsProp) return columnsProp;
    if (itemWidth === 'auto') return 1;
    return Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
  }, [columnsProp, itemWidth, containerWidth, gap]);

  // Calculate rows
  const rowCount = Math.ceil(items.length / columns);
  const rowHeight = itemHeight + gap;

  // Calculate visible range
  const { startRow, visibleRows } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleRowCount = Math.ceil(containerHeight / rowHeight);
    const end = Math.min(rowCount - 1, start + visibleRowCount + overscan * 2);

    const rows: T[][] = [];
    for (let row = start; row <= end; row++) {
      const rowItems: T[] = [];
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index < items.length) {
          rowItems.push(items[index]);
        }
      }
      rows.push(rowItems);
    }

    return {
      startRow: start,
      endRow: end,
      visibleRows: rows,
    };
  }, [scrollTop, rowHeight, rowCount, containerHeight, items, columns, overscan]);

  // Total height of all rows
  const totalHeight = rowCount * rowHeight - gap;

  // Offset for the visible rows
  const offsetY = startRow * rowHeight;

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // Track container width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Get key for item
  const getKey = useCallback(
    (item: T, rowIndex: number, colIndex: number) => {
      const globalIndex = (startRow + rowIndex) * columns + colIndex;
      if (keyExtractor) {
        return keyExtractor(item, globalIndex);
      }
      return globalIndex;
    },
    [keyExtractor, startRow, columns]
  );

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleRows.map((row, rowIndex) => (
            <div
              key={startRow + rowIndex}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap,
                marginBottom: gap,
              }}
            >
              {row.map((item, colIndex) => (
                <div key={getKey(item, rowIndex, colIndex)} style={{ height: itemHeight }}>
                  {renderItem(item, (startRow + rowIndex) * columns + colIndex)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for creating a custom virtualized renderer
 */
export function useVirtualization<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    return {
      startIndex: start,
      endIndex: end,
      totalHeight: items.length * itemHeight,
      offsetY: start * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    handleScroll,
    containerProps: {
      style: { height: containerHeight, overflow: 'auto' },
      onScroll: handleScroll,
    },
    innerProps: {
      style: { height: totalHeight, position: 'relative' as const },
    },
    itemsProps: {
      style: {
        position: 'absolute' as const,
        top: offsetY,
        left: 0,
        right: 0,
      },
    },
  };
}
