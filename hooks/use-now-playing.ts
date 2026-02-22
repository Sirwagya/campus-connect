"use client";

import { useState, useEffect, useCallback } from "react";

interface SpotifyTrack {
    is_playing: boolean;
    name?: string;
    artists?: string[];
    album?: string;
    album_art?: string;
    duration_ms?: number;
    progress_ms?: number;
    device?: {
        name: string;
        type: string;
    };
}

interface UseNowPlayingOptions {
    enabled?: boolean;
    pollInterval?: number; // milliseconds, default 5000
}

interface UseNowPlayingResult {
    track: SpotifyTrack | null;
    isPlaying: boolean;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to poll user's Spotify now playing status
 * 
 * @param userId - The user ID to fetch now playing for
 * @param options - Configuration options
 * @returns Now playing state and controls
 * 
 * @example
 * ```tsx
 * const { track, isPlaying, isLoading } = useNowPlaying(userId);
 * 
 * if (isPlaying && track) {
 *   return <SpotifyWidget track={track} />;
 * }
 * ```
 */
export function useNowPlaying(
    userId: string,
    options: UseNowPlayingOptions = {}
): UseNowPlayingResult {
    const { enabled = true, pollInterval = 5000 } = options;

    const [track, setTrack] = useState<SpotifyTrack | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchNowPlaying = useCallback(async () => {
        if (!enabled || !userId) return;

        try {
            const res = await fetch(`/api/spotify/now-playing?userId=${userId}`);

            if (!res.ok) {
                throw new Error(`Failed to fetch: ${res.status}`);
            }

            const data = await res.json();

            if (data.not_connected || data.token_error) {
                setTrack(null);
                return;
            }

            setTrack(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Unknown error"));
            setTrack(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId, enabled]);

    // Initial fetch and polling
    useEffect(() => {
        if (!enabled) return;

        fetchNowPlaying();

        const interval = setInterval(fetchNowPlaying, pollInterval);

        return () => clearInterval(interval);
    }, [enabled, pollInterval, fetchNowPlaying]);

    return {
        track,
        isPlaying: track?.is_playing ?? false,
        isLoading,
        error,
        refetch: fetchNowPlaying,
    };
}
