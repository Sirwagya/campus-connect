"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Github, Linkedin, Globe, Calendar, Eye, Twitter } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FollowButton, PresenceIndicator } from "./FollowButton";

interface User {
  id?: string;
  full_name?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
}

interface Profile {
  id: string;
  user?: User;
  display_name?: string;
  username?: string;
  tagline?: string;
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
}

interface ProfileHeaderProps {
  profile: Profile;
  isOwner: boolean;
  isPreview: boolean;
}

export function ProfileHeader({ profile, isOwner }: ProfileHeaderProps) {
  const user = profile.user || {};
  const displayName = profile.display_name || user.full_name || "User";
  const username =
    profile.username || user.username || user.email?.split("@")[0] || "user";
  const tagline = profile.tagline || "Student at Campus Connect";
  const avatarUrl = profile.avatar_url || user.avatar_url;
  const coverUrl = profile.cover_url;
  const role = user.role || "Student";
  const joinedYear = new Date(profile.created_at || "2024-01-01").getFullYear();

  return (
    <div className="relative w-full group">
      {/* Full Width Banner */}
      <div className="h-[300px] md:h-[400px] w-full relative overflow-hidden bg-[#121212]">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt="Profile cover"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#404040] via-[#181818] to-[#121212]" />
        )}

        {/* Gradient Overlay (Vignette) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent z-10" />

        {/* Content Container */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 z-20 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end gap-6 md:gap-8">
            {/* Avatar - Circular & Animated with Presence */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative shrink-0 shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-full"
            >
              <Avatar className="h-32 w-32 md:h-48 md:w-48 border-[6px] border-[#121212] shadow-2xl">
                <AvatarImage
                  src={avatarUrl}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl bg-[#282828] text-white">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Presence indicator */}
              {profile.id && (
                <PresenceIndicator
                  userId={profile.id}
                  size="lg"
                  className="bottom-3 right-3"
                />
              )}
            </motion.div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 mb-2 w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {/* Badges & Meta */}
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-white/10 hover:bg-white/20 text-white border-none uppercase tracking-wider text-[10px] backdrop-blur-md">
                    {role}
                  </Badge>
                  {profile.visibility === "private" && (
                    <Badge
                      variant="outline"
                      className="border-white/20 text-white/60 text-[10px]"
                    >
                      Private
                    </Badge>
                  )}
                </div>

                {/* Name */}
                <h1 className="text-4xl md:text-7xl font-bold text-white mb-2 tracking-tight drop-shadow-lg truncate pb-2">
                  {displayName}
                </h1>

                {/* Tagline */}
                <p className="text-lg md:text-xl text-white/80 max-w-2xl line-clamp-2 mb-4 font-medium">
                  {tagline}
                </p>

                {/* Socials & Meta Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1 hover:text-white transition-colors">
                    <span className="text-[#a970ff]">@</span>
                    {username}
                  </span>

                  <span className="w-1 h-1 rounded-full bg-white/30" />

                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {joinedYear}
                  </span>

                  {/* Social Links */}
                  {profile.social_links &&
                    Object.values(profile.social_links).some(
                      (v) => v && String(v).trim()
                    ) && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                        <div className="flex items-center gap-3">
                          {profile.social_links.github && (
                            <Link
                              href={profile.social_links.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-white transition-colors hover:scale-110 transform duration-200"
                              aria-label="GitHub Profile"
                            >
                              <Github className="h-4 w-4" />
                            </Link>
                          )}
                          {profile.social_links.linkedin && (
                            <Link
                              href={profile.social_links.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-white transition-colors hover:scale-110 transform duration-200"
                              aria-label="LinkedIn Profile"
                            >
                              <Linkedin className="h-4 w-4" />
                            </Link>
                          )}
                          {profile.social_links.twitter && (
                            <Link
                              href={profile.social_links.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-white transition-colors hover:scale-110 transform duration-200"
                              aria-label="Twitter Profile"
                            >
                              <Twitter className="h-4 w-4" />
                            </Link>
                          )}
                          {profile.social_links.website && (
                            <Link
                              href={profile.social_links.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-white transition-colors hover:scale-110 transform duration-200"
                              aria-label="Personal Website"
                            >
                              <Globe className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                </div>
              </motion.div>
            </div>

            {/* Actions (Desktop: Right aligned, Mobile: Full width below) */}
            <div className="flex items-center gap-3 shrink-0 mb-2">
              {isOwner ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="hidden md:flex bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white hover:text-white rounded-full px-6"
                  >
                    <Link href={`/profile/${profile.id}?preview=true`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold rounded-full px-8 py-6 shadow-[0_0_20px_rgba(30,215,96,0.3)] hover:scale-105 transition-transform"
                  >
                    <Link href="/profile/edit">Edit Profile</Link>
                  </Button>
                </>
              ) : (
                /* Follow button for non-owners */
                profile.id && (
                  <FollowButton targetUserId={profile.id} showCounts />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
