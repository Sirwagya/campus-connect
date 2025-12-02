import { useEffect, useState, useRef } from "react";

/**
 * A hook that debounces a value.
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Clear any existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Set new timer
        timerRef.current = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup on unmount or when value/delay changes
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [value, delay]);

    return debouncedValue;
}
