import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';

/**
 * Subscribe to media query changes
 */
function subscribeMediaQuery(query: string, callback: () => void) {
  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

/**
 * Get current media query state
 */
function getMediaQuerySnapshot(query: string) {
  return () => window.matchMedia(query).matches;
}

/**
 * Server snapshot always returns false
 */
function getServerSnapshot() {
  return false;
}

/**
 * Hook for responsive design based on media queries
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useMemo(
    () => (callback: () => void) => subscribeMediaQuery(query, callback),
    [query]
  );

  const getSnapshot = useMemo(() => getMediaQuerySnapshot(query), [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Breakpoint values matching Tailwind CSS defaults
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

type Breakpoint = keyof typeof breakpoints;

/**
 * Hook for checking if screen is above a specific breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]})`);
}

/**
 * Hook for checking if screen is below a specific breakpoint
 */
export function useBreakpointMax(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(max-width: ${breakpoints[breakpoint]})`);
}

/**
 * Hook for checking if screen is between two breakpoints
 */
export function useBreakpointBetween(
  minBreakpoint: Breakpoint,
  maxBreakpoint: Breakpoint
): boolean {
  return useMediaQuery(
    `(min-width: ${breakpoints[minBreakpoint]}) and (max-width: ${breakpoints[maxBreakpoint]})`
  );
}

/**
 * Hook that returns all breakpoint states at once
 */
export function useBreakpoints() {
  const isSm = useBreakpoint('sm');
  const isMd = useBreakpoint('md');
  const isLg = useBreakpoint('lg');
  const isXl = useBreakpoint('xl');
  const is2Xl = useBreakpoint('2xl');

  return useMemo(() => ({
    sm: isSm,
    md: isMd,
    lg: isLg,
    xl: isXl,
    '2xl': is2Xl,
    // Convenience booleans
    isMobile: !isSm,
    isTablet: isSm && !isLg,
    isDesktop: isLg,
    isLargeDesktop: isXl,
    // Current breakpoint name
    current: is2Xl ? '2xl' : isXl ? 'xl' : isLg ? 'lg' : isMd ? 'md' : isSm ? 'sm' : 'xs',
  }), [isSm, isMd, isLg, isXl, is2Xl]);
}

/**
 * Hook for detecting user's color scheme preference
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook for detecting user's motion preference
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook for detecting if user prefers high contrast
 */
export function usePrefersContrast(): boolean {
  return useMediaQuery('(prefers-contrast: more)');
}

/**
 * Hook for detecting if device is touch-capable
 */
export function useIsTouchDevice(): boolean {
  const hasCoarsePointer = useMediaQuery('(pointer: coarse)');
  const hasHover = useMediaQuery('(hover: hover)');
  
  // Touch devices typically have coarse pointers and no hover
  return hasCoarsePointer || !hasHover;
}

/**
 * Hook for checking device orientation
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
}

/**
 * Hook for screen size categories
 */
export function useScreenSize() {
  const width = useWindowSize().width;

  return useMemo(() => {
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
  }, [width]);
}

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook for getting current window dimensions
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Hook for responsive value selection
 */
export function useResponsiveValue<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
  default: T;
}): T {
  const breakpoints = useBreakpoints();

  return useMemo(() => {
    if (breakpoints['2xl'] && values['2xl'] !== undefined) return values['2xl'];
    if (breakpoints.xl && values.xl !== undefined) return values.xl;
    if (breakpoints.lg && values.lg !== undefined) return values.lg;
    if (breakpoints.md && values.md !== undefined) return values.md;
    if (breakpoints.sm && values.sm !== undefined) return values.sm;
    if (values.xs !== undefined) return values.xs;
    return values.default;
  }, [breakpoints, values]);
}
