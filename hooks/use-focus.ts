import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  enabled?: boolean;
  /** Return focus to the element that triggered the trap when disabled */
  returnFocus?: boolean;
  /** Auto-focus the first focusable element when enabled */
  autoFocus?: boolean;
  /** Element to focus when trap is activated */
  initialFocus?: HTMLElement | null;
  /** Element to focus when trap is deactivated */
  finalFocus?: HTMLElement | null;
}

/**
 * Hook to trap focus within a container element
 * Useful for modals, dialogs, and other overlay components
 */
export function useFocusTrap<T extends HTMLElement>(
  options: UseFocusTrapOptions = {}
) {
  const {
    enabled = true,
    returnFocus = true,
    autoFocus = true,
    initialFocus,
    finalFocus,
  } = options;

  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter((el) => el.offsetParent !== null); // Filter out hidden elements
  }, []);

  // Focus first element
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, [getFocusableElements]);

  // Focus last element
  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getFocusableElements]);

  // Handle Tab key to trap focus
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || event.key !== 'Tab') return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      // Shift+Tab on first element -> go to last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab on last element -> go to first
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [enabled, getFocusableElements]
  );

  // Setup and cleanup
  useEffect(() => {
    if (!enabled) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus initial element or first focusable
    if (initialFocus) {
      initialFocus.focus();
    } else if (autoFocus) {
      // Slight delay to ensure DOM is ready
      requestAnimationFrame(() => {
        focusFirst();
      });
    }

    // Add keydown listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus when disabled
      if (returnFocus) {
        const elementToFocus = finalFocus || previousFocusRef.current;
        if (elementToFocus && typeof elementToFocus.focus === 'function') {
          elementToFocus.focus();
        }
      }
    };
  }, [enabled, autoFocus, returnFocus, initialFocus, finalFocus, focusFirst, handleKeyDown]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    getFocusableElements,
  };
}

/**
 * Hook to manage focus when modal/dialog opens and closes
 */
export function useModalFocus(isOpen: boolean) {
  const { containerRef } = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    returnFocus: true,
    autoFocus: true,
  });

  return containerRef;
}

/**
 * Hook to handle focus on mount/unmount
 */
export function useAutoFocus<T extends HTMLElement>(
  options: { enabled?: boolean; delay?: number } = {}
) {
  const { enabled = true, delay = 0 } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const timer = setTimeout(() => {
      ref.current?.focus();
    }, delay);

    return () => clearTimeout(timer);
  }, [enabled, delay]);

  return ref;
}

/**
 * Hook to detect when focus leaves a container
 */
export function useFocusLeave(
  callback: () => void,
  options: { delay?: number } = {}
) {
  const { delay = 0 } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFocusOut = useCallback(
    (event: FocusEvent) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Check if focus is leaving the container
      const relatedTarget = event.relatedTarget as HTMLElement | null;
      if (!containerRef.current?.contains(relatedTarget)) {
        timeoutRef.current = setTimeout(callback, delay);
      }
    },
    [callback, delay]
  );

  const handleFocusIn = useCallback(() => {
    // Cancel callback if focus returns to container
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('focusout', handleFocusOut);
    container.addEventListener('focusin', handleFocusIn);

    return () => {
      container.removeEventListener('focusout', handleFocusOut);
      container.removeEventListener('focusin', handleFocusIn);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleFocusOut, handleFocusIn]);

  return containerRef;
}
