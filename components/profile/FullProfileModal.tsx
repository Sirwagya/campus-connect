"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { SpotifyNowPlaying } from "./SpotifyNowPlaying";
import { LevelProgressBar } from "./LevelProgressBar";
import { SkillsAndTags } from "./SkillsAndTags";
import { ProfileProjects } from "./ProfileProjects";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { Github, Linkedin, Globe, Calendar, Twitter } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface FullProfile {
  id: string;
  display_name: string;
  username: string;
  tagline?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  created_at?: string;
  visibility?: string;
  social_links?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  skills?: any[];
  projects?: any[];
  stats?: {
    total_xp?: number;
  };
  user?: {
    role?: string;
  };
  integrations?: any[];
  spotify_connected?: boolean;
}

interface FullProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: { x: number; y: number }; // For animation from mini card
}

export function FullProfileModal({
  userId,
  isOpen,
  onClose,
  initialPosition,
}: FullProfileModalProps) {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch full profile data
  useEffect(() => {
    if (!isOpen) return;

    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch(`/api/profiles/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId, isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleGoToProfile = useCallback(() => {
    onClose();
    router.push(`/profile/${userId}`);
  }, [onClose, router, userId]);

  if (!mounted) return null;

  const joinedYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : null;
  const role = profile?.user?.role || "Student";
  const levelData = {
    level: 1,
    progress: 0,
    currentXP: profile?.stats?.total_xp || 0,
    nextLevelXP: 1000,
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9998]"
            style={{ backdropFilter: "blur(16px)" }}
          />

          {/* Modal container */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
              y: initialPosition ? 20 : 40,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 md:inset-x-[5%] md:inset-y-[3%] z-[9999] overflow-hidden"
          >
            <div className="h-full w-full bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/60 hover:text-white transition-colors backdrop-blur-sm border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : profile ? (
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {/* Header with banner */}
                  <div className="relative h-[200px] md:h-[280px] w-full overflow-hidden bg-[#121212]">
                    {profile.cover_url ? (
                      <Image
                        src={profile.cover_url}
                        alt="Cover"
                        fill
                        className="object-cover opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-primary/30 via-black to-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />

                    {/* Profile info overlay */}
                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
                      <div className="flex flex-col md:flex-row items-end gap-6">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-[#0a0a0f] shadow-2xl">
                            <AvatarImage
                              src={profile.avatar_url}
                              alt={profile.display_name}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-4xl bg-white/10 text-white">
                              {profile.display_name?.charAt(0).toUpperCase() ||
                                "?"}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Name & info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-white/10 text-white border-none text-xs uppercase tracking-wider">
                              {role}
                            </Badge>
                          </div>
                          <h1 className="text-3xl md:text-5xl font-bold text-white mb-1 truncate">
                            {profile.display_name}
                          </h1>
                          <p className="text-lg text-white/70 mb-3">
                            @{profile.username}
                          </p>
                          {profile.tagline && (
                            <p className="text-base text-white/60 max-w-xl">
                              {profile.tagline}
                            </p>
                          )}

                          {/* Meta & socials */}
                          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/50">
                            {joinedYear && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Joined {joinedYear}
                              </span>
                            )}
                            {profile.social_links && (
                              <div className="flex items-center gap-3">
                                {profile.social_links.github && (
                                  <Link
                                    href={profile.social_links.github}
                                    target="_blank"
                                    className="hover:text-white transition-colors"
                                  >
                                    <Github className="w-4 h-4" />
                                  </Link>
                                )}
                                {profile.social_links.linkedin && (
                                  <Link
                                    href={profile.social_links.linkedin}
                                    target="_blank"
                                    className="hover:text-white transition-colors"
                                  >
                                    <Linkedin className="w-4 h-4" />
                                  </Link>
                                )}
                                {profile.social_links.twitter && (
                                  <Link
                                    href={profile.social_links.twitter}
                                    target="_blank"
                                    className="hover:text-white transition-colors"
                                  >
                                    <Twitter className="w-4 h-4" />
                                  </Link>
                                )}
                                {profile.social_links.website && (
                                  <Link
                                    href={profile.social_links.website}
                                    target="_blank"
                                    className="hover:text-white transition-colors"
                                  >
                                    <Globe className="w-4 h-4" />
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Go to full profile button */}
                        <Button
                          onClick={handleGoToProfile}
                          variant="outline"
                          className="hidden md:flex bg-transparent border-white/20 text-white hover:bg-white/10 rounded-full px-6"
                        >
                          Open Full Profile
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Main content */}
                      <div className="lg:col-span-8 space-y-8">
                        {/* Level progress */}
                        <LevelProgressBar
                          level={levelData.level}
                          currentXP={levelData.currentXP}
                          nextLevelXP={levelData.nextLevelXP}
                          progress={levelData.progress}
                        />

                        {/* Spotify Now Playing (full mode) */}
                        {profile.spotify_connected && (
                          <SpotifyNowPlaying userId={userId} mode="full" />
                        )}

                        {/* Tabs */}
                        <Tabs defaultValue="overview" className="w-full">
                          <TabsList className="w-full justify-start bg-transparent border-b border-white/10 p-0 h-auto rounded-none mb-6">
                            <TabsTrigger
                              value="overview"
                              className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-white text-white/60"
                            >
                              Overview
                            </TabsTrigger>
                            <TabsTrigger
                              value="projects"
                              className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-white text-white/60"
                            >
                              Projects
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="overview" className="space-y-8">
                            <IntegrationsPanel
                              profile={profile as any}
                              isOwner={false}
                            />
                          </TabsContent>

                          <TabsContent value="projects">
                            <ProfileProjects
                              projects={profile.projects || []}
                            />
                          </TabsContent>
                        </Tabs>
                      </div>

                      {/* Sidebar */}
                      <div className="lg:col-span-4 space-y-8">
                        {/* Bio */}
                        {profile.bio && (
                          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">
                              About
                            </h3>
                            <p className="text-white/80 text-sm leading-relaxed">
                              {profile.bio}
                            </p>
                          </div>
                        )}

                        {/* Skills */}
                        <SkillsAndTags
                          skills={profile.skills || []}
                          isOwner={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-white/60">
                  Profile not found
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
