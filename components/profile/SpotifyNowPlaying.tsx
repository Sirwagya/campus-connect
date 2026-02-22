"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Pause, Play, Smartphone, Monitor, Globe } from "lucide-react";

interface SpotifyTrack {
  name: string;
  artists: string[];
  album: string;
  album_art: string;
  duration_ms: number;
  progress_ms: number;
  is_playing: boolean;
  device?: {
    name: string;
    type: "smartphone" | "computer" | "web" | "speaker";
  };
}

interface SpotifyNowPlayingProps {
  userId: string;
  mode: "mini" | "full";
}

export function SpotifyNowPlaying({ userId, mode }: SpotifyNowPlayingProps) {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Poll for current track every 5 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function fetchNowPlaying() {
      try {
        const res = await fetch(`/api/spotify/now-playing?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.is_playing !== undefined) {
            setTrack(data);
            setError(false);
          } else {
            setTrack(null);
          }
        } else {
          setTrack(null);
        }
      } catch (err) {
        console.error("Spotify fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchNowPlaying();
    interval = setInterval(fetchNowPlaying, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  // Calculate progress percentage
  const progressPercent = track
    ? (track.progress_ms / track.duration_ms) * 100
    : 0;

  // Format time (ms to mm:ss)
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get device icon
  const getDeviceIcon = (type?: string) => {
    switch (type) {
      case "smartphone":
        return <Smartphone className="w-3 h-3" />;
      case "computer":
        return <Monitor className="w-3 h-3" />;
      default:
        return <Globe className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/40 text-xs">
        <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
        <span>Loading Spotify...</span>
      </div>
    );
  }

  if (error || !track) {
    return null; // Don't show anything if not playing
  }

  // Mini mode - compact widget for MiniProfileCard
  if (mode === "mini") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="flex items-center gap-3 p-2 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/20"
        >
          {/* Mini album art */}
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-lg">
            <Image
              src={track.album_art}
              alt={track.album}
              fill
              className="object-cover"
            />
            {/* Play/Pause overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              {track.is_playing ? (
                <div className="flex gap-0.5">
                  <span className="w-0.5 h-3 bg-[#1DB954] animate-pulse" />
                  <span className="w-0.5 h-3 bg-[#1DB954] animate-pulse delay-100" />
                  <span className="w-0.5 h-3 bg-[#1DB954] animate-pulse delay-200" />
                </div>
              ) : (
                <Pause className="w-4 h-4 text-white" />
              )}
            </div>
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#1DB954] font-medium flex items-center gap-1">
              <Music className="w-3 h-3" />
              Listening on Spotify
            </p>
            <p className="text-sm text-white font-medium truncate">
              {track.name}
            </p>
            <p className="text-xs text-white/60 truncate">
              {track.artists.join(", ")}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Full mode - rich widget for FullProfileModal
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="p-5 rounded-2xl bg-gradient-to-br from-[#1DB954]/20 via-[#1DB954]/10 to-transparent border border-[#1DB954]/20 backdrop-blur-sm"
      >
        {/* Header */}
        <div className="flex items-center gap-2 text-[#1DB954] text-sm font-medium mb-4">
          <Music className="w-4 h-4" />
          <span>Listening on Spotify</span>
          {track.device && (
            <span className="ml-auto flex items-center gap-1 text-white/40 text-xs">
              {getDeviceIcon(track.device.type)}
              {track.device.name}
            </span>
          )}
        </div>

        <div className="flex gap-4">
          {/* Large album art */}
          <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 shadow-xl shadow-[#1DB954]/20">
            <Image
              src={track.album_art}
              alt={track.album}
              fill
              className="object-cover"
            />
          </div>

          {/* Track details */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-lg text-white font-bold line-clamp-2 leading-tight">
              {track.name}
            </p>
            <p className="text-sm text-white/70 truncate mt-1">
              {track.artists.join(", ")}
            </p>
            <p className="text-xs text-white/50 truncate">{track.album}</p>
          </div>

          {/* Play/Pause indicator */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1DB954] shadow-lg shadow-[#1DB954]/30">
            {track.is_playing ? (
              <Play className="w-5 h-5 text-black fill-black" />
            ) : (
              <Pause className="w-5 h-5 text-black" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>{formatTime(track.progress_ms)}</span>
            <span>{formatTime(track.duration_ms)}</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#1DB954] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
