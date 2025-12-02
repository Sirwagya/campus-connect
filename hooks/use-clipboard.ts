import { useState, useCallback } from 'react';

interface CopyState {
  copied: boolean;
  error: Error | null;
}

interface UseCopyToClipboardOptions {
  /** Duration to show "copied" state in milliseconds */
  resetDelay?: number;
  /** Callback on successful copy */
  onCopy?: (text: string) => void;
  /** Callback on copy error */
  onError?: (error: Error) => void;
}

/**
 * Hook for copying text to clipboard with state management
 */
export function useCopyToClipboard(options: UseCopyToClipboardOptions = {}) {
  const { resetDelay = 2000, onCopy, onError } = options;
  const [state, setState] = useState<CopyState>({ copied: false, error: null });

  const copy = useCallback(
    async (text: string) => {
      if (!navigator?.clipboard) {
        const error = new Error('Clipboard API not available');
        setState({ copied: false, error });
        onError?.(error);
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setState({ copied: true, error: null });
        onCopy?.(text);

        // Reset after delay
        setTimeout(() => {
          setState((prev) => ({ ...prev, copied: false }));
        }, resetDelay);

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy');
        setState({ copied: false, error });
        onError?.(error);
        return false;
      }
    },
    [resetDelay, onCopy, onError]
  );

  const reset = useCallback(() => {
    setState({ copied: false, error: null });
  }, []);

  return {
    copy,
    copied: state.copied,
    error: state.error,
    reset,
  };
}

/**
 * Standalone copy function (without hook)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator?.clipboard) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch {
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read text from clipboard
 */
export async function readFromClipboard(): Promise<string | null> {
  if (!navigator?.clipboard) {
    return null;
  }

  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

/**
 * Hook for reading from clipboard
 */
export function useClipboardRead() {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isReading, setIsReading] = useState(false);

  const read = useCallback(async () => {
    setIsReading(true);
    setError(null);

    try {
      const clipboardText = await readFromClipboard();
      setText(clipboardText);
      return clipboardText;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to read clipboard');
      setError(error);
      return null;
    } finally {
      setIsReading(false);
    }
  }, []);

  return {
    text,
    read,
    error,
    isReading,
  };
}
