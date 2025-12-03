"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Newspaper,
  Users,
  Calendar,
  Mail,
  LogOut,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Settings,
  Cog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { Button } from "./ui/Button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { usePresenceContext } from "./PresenceProvider";
import { GlobalSearch } from "./search/GlobalSearch";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/Avatar";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/spaces", label: "Spaces", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/alerts", label: "Alerts", icon: Mail },
];

const adminNavItems = [
  { href: "/admin/events", label: "Manage Events", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, isAdmin } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Safe presence hook usage - will be undefined if outside PresenceProvider
  let presenceStatus: "online" | "away" | "busy" | "offline" = "offline";
  try {
    const presence = usePresenceContext();
    presenceStatus = presence.status;
  } catch {
    // Not wrapped in PresenceProvider, use default
  }

  useEffect(() => {
    async function fetchAvatar() {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      } else {
        const { data: userData } = await supabase
          .from("users")
          .select("avatar_url")
          .eq("id", user.id)
          .single();

        if (userData?.avatar_url) {
          setAvatarUrl(userData.avatar_url);
        } else if (user.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
        }
      }
    }

    fetchAvatar();
  }, [user]);

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden h-screen flex-col border-r border-white/10 bg-black/80 backdrop-blur-xl md:flex sticky top-0 z-50"
    >
      {/* Header */}
      <div className="flex h-20 items-center justify-between px-6">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-glow">
                <span className="font-bold text-white text-lg">V</span>
              </div>
              <span className="text-lg font-light tracking-tight text-white whitespace-nowrap">
                Ved Hub
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white/60 hover:text-white hover:bg-white/5 p-0"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-3 pb-2">
          <GlobalSearch />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                isActive
                  ? "bg-white/10 text-white font-medium shadow-glass"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full shadow-glow"
                />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive
                    ? "text-primary drop-shadow-[0_0_8px_rgba(107,79,255,0.5)]"
                    : "group-hover:text-white"
                )}
              />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap font-light tracking-wide"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {/* Admin Links */}
        {isAdmin && (
          <>
            <div
              className={cn(
                "mt-8 mb-2 px-4 transition-opacity",
                isCollapsed ? "opacity-0" : "opacity-100"
              )}
            >
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Admin
              </span>
            </div>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                    isActive
                      ? "bg-white/10 text-white font-medium shadow-glass"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="whitespace-nowrap font-light tracking-wide"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer / User */}
      <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/10">
        {user ? (
          <Link
            href={`/profile/${user.id}`}
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer hover:bg-white/5 group",
              isCollapsed && "justify-center"
            )}
          >
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-primary/50 transition-colors">
                <AvatarImage
                  src={avatarUrl || undefined}
                  className="object-cover"
                />
                <AvatarFallback className="bg-white/10 text-white/60">
                  {user.email?.charAt(0).toUpperCase() || (
                    <UserIcon className="h-5 w-5" />
                  )}
                </AvatarFallback>
              </Avatar>

              {/* Presence indicator */}
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-black",
                  presenceStatus === "online" &&
                    "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
                  presenceStatus === "away" && "bg-yellow-500",
                  presenceStatus === "busy" && "bg-red-500",
                  presenceStatus === "offline" && "bg-white/20"
                )}
              />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex flex-col overflow-hidden min-w-0"
                >
                  <span className="text-sm font-medium truncate text-white group-hover:text-primary transition-colors">
                    {user.email?.split("@")[0]}
                  </span>
                  <span className="text-xs text-white/40 truncate">
                    View Profile
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        ) : (
          !isCollapsed && (
            <div className="px-2 mb-4 text-sm text-white/40">Not signed in</div>
          )
        )}

        {/* Settings Link */}
        {user && (
          <Link
            href="/profile/settings"
            className={cn(
              "flex items-center gap-3 w-full p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors mt-2",
              isCollapsed && "justify-center",
              pathname === "/profile/settings" && "bg-white/10 text-white"
            )}
          >
            <Cog className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="font-light">Settings</span>}
          </Link>
        )}

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-white/60 hover:text-white hover:bg-white/5 mt-2 rounded-xl",
            isCollapsed && "justify-center px-0"
          )}
          onClick={signOut}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="font-light">Sign Out</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
