'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type ShortcutHandler = () => void;

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description: string;
}

// Global keyboard shortcuts for the app
const globalShortcuts: Omit<KeyboardShortcut, 'handler'>[] = [
  { key: 'g', description: 'Go to Home', meta: true },
  { key: 'f', description: 'Go to Feed', meta: true },
  { key: 's', description: 'Go to Spaces', meta: true },
  { key: 'e', description: 'Go to Events', meta: true },
  { key: 'p', description: 'Go to Profile', meta: true },
  { key: '/', description: 'Focus search' },
  { key: 'n', description: 'New post', shift: true },
  { key: 'Escape', description: 'Close modal/dialog' },
  { key: '?', description: 'Show keyboard shortcuts', shift: true },
];

export function useKeyboardShortcuts() {
  const router = useRouter();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape in inputs
      if (event.key !== 'Escape') return;
    }

    const isMeta = event.metaKey || event.ctrlKey;

    // Navigation shortcuts (Cmd/Ctrl + key)
    if (isMeta && !event.shiftKey) {
      switch (event.key.toLowerCase()) {
        case 'g':
          event.preventDefault();
          router.push('/');
          break;
        case 'f':
          event.preventDefault();
          router.push('/feed');
          break;
        case 's':
          event.preventDefault();
          router.push('/spaces');
          break;
        case 'e':
          event.preventDefault();
          router.push('/events');
          break;
        case 'p':
          event.preventDefault();
          router.push('/profile/settings');
          break;
      }
    }

    // Focus search with /
    if (event.key === '/' && !isMeta && !event.shiftKey) {
      event.preventDefault();
      const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
      searchInput?.focus();
    }

    // Show shortcuts help with Shift + ?
    if (event.key === '?' && event.shiftKey) {
      event.preventDefault();
      // Dispatch custom event for shortcuts modal
      window.dispatchEvent(new CustomEvent('show-shortcuts'));
    }
  }, [router]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts: globalShortcuts };
}

// Hook for component-specific shortcuts
export function useShortcut(
  key: string,
  handler: ShortcutHandler,
  options?: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const matchesMeta = options?.meta ? (event.metaKey || event.ctrlKey) : !(event.metaKey || event.ctrlKey);
      const matchesShift = options?.shift ? event.shiftKey : !event.shiftKey;
      const matchesAlt = options?.alt ? event.altKey : !event.altKey;

      if (event.key.toLowerCase() === key.toLowerCase() && matchesMeta && matchesShift && matchesAlt) {
        event.preventDefault();
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, handler, options]);
}

// Keyboard shortcuts provider component
export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  return <>{children}</>;
}
