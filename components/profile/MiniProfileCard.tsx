"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ExternalLink,
  X,
  Github,
  Linkedin,
  Globe,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface MiniProfileData {
  id: string;
  display_name: string;
  username: string;
  tagline?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  created_at?: string;
  is_online?: boolean;
  spotify_connected?: boolean;
  social_links?: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
  skills?: Array<{ name: string; level?: string }>;
  stats?: {
    total_xp?: number;
    level?: number;
    current_streak?: number;
  };
}

interface MiniProfileCardProps {
  userId: string;
  anchorRect: DOMRect;
  onClose: () => void;
  onViewFullProfile: () => void;
}

// Calculate level from XP
function calculateLevel(xp: number): { level: number; progress: number } {
  const xpPerLevel = 1000;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const progress = ((xp % xpPerLevel) / xpPerLevel) * 100;
  return { level, progress };
}

export function MiniProfileCard({
  userId,
  anchorRect,
  onClose,
  onViewFullProfile,
}: MiniProfileCardProps) {
  const [profile, setProfile] = useState<MiniProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/profiles/${userId}/mini`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch mini profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Close on route change
  useEffect(() => {
    const handleRouteChange = () => onClose();
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [onClose]);

  // Calculate position
  const calculatePosition = () => {
    const cardHeight = 400;
    const cardWidth = 320;
    const padding = 16;

    let top = anchorRect.bottom + padding;
    let left = anchorRect.left;

    if (top + cardHeight > window.innerHeight) {
      top = anchorRect.top - cardHeight - padding;
    }
    if (left + cardWidth > window.innerWidth) {
      left = window.innerWidth - cardWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }
    if (top < padding) {
      top = padding;
    }

    return { top, left };
  };

  if (!mounted) return null;

  const position = calculatePosition();
  const joinedYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : null;

  const xp = profile?.stats?.total_xp || 0;
  const levelData = calculateLevel(xp);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="mini-profile-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998]"
        style={{ pointerEvents: "none" }}
      />
      <motion.div
        key="mini-profile-card"
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed z-[9999]"
        style={{
          top: position.top,
          left: position.left,
          width: 320,
        }}
      >
        <div
          className="bg-[#0d0d12]/95 backdrop-blur-xl rounded-[20px] overflow-hidden"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0px 0px 20px rgba(0,0,0,0.4)",
          }}
        >
          {loading ? (
            <div className="p-6 flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : profile ? (
            <>
              {/* Banner */}
              <div
                className="relative h-16 bg-gradient-to-br from-primary/40 via-purple-600/30 to-primary/20"
                style={
                  profile.banner_url
                    ? {
                        backgroundImage: `url(${profile.banner_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
              >
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/60 hover:text-white transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 pb-5">
                {/* Avatar overlapping banner */}
                <div className="flex items-end gap-3 -mt-8 mb-3">
                  <div className="relative">
                    <Avatar
                      className="h-16 w-16 border-4 border-[#0d0d12]"
                      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
                    >
                      <AvatarImage
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xl bg-white/10 text-white">
                        {profile.display_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <span
                      className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[3px] border-[#0d0d12] ${
                        profile.is_online ? "bg-green-500" : "bg-gray-500"
                      }`}
                      style={
                        profile.is_online
                          ? { boxShadow: "0 0 8px rgba(34,197,94,0.6)" }
                          : {}
                      }
                    />
                  </div>

                  {/* Status Badge */}
                  <Badge
                    className={`text-[10px] px-2 py-0.5 font-medium mb-1 ${
                      profile.is_online
                        ? "bg-green-500/15 text-green-400 border-green-500/20"
                        : "bg-white/5 text-white/40 border-white/10"
                    }`}
                  >
                    {profile.is_online ? "Online" : "Offline"}
                  </Badge>
                </div>

                {/* Name & Username */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-white leading-tight">
                    {profile.display_name}
                  </h3>
                  <p className="text-sm font-medium text-white/50">
                    @{profile.username}
                  </p>
                </div>

                {/* Tagline only (no bio/about section) */}
                {profile.tagline && (
                  <p className="text-sm text-white/70 mb-3 line-clamp-2">
                    {profile.tagline}
                  </p>
                )}

                {/* Joined date */}
                {joinedYear && (
                  <div className="flex items-center gap-1.5 text-xs text-white/40 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Joined {joinedYear}</span>
                  </div>
                )}

                {/* Compact Level Block */}
                <div
                  className="bg-white/[0.03] rounded-xl p-3 mb-3"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-white">
                        Lv. {levelData.level}
                      </span>
                    </div>
                    <span className="text-xs text-white/40">
                      {xp.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${levelData.progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Social icons */}
                {profile.social_links &&
                  Object.values(profile.social_links).some(Boolean) && (
                    <div className="flex items-center gap-2 mb-4">
                      {profile.social_links.github && (
                        <a
                          href={profile.social_links.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {profile.social_links.linkedin && (
                        <a
                          href={profile.social_links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {profile.social_links.website && (
                        <a
                          href={profile.social_links.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}

                {/* View Full Profile button */}
                <Button
                  onClick={onViewFullProfile}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-2.5 px-6 font-medium shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02]"
                >
                  View Full Profile
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-white/50 text-sm">
              Profile not found
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
