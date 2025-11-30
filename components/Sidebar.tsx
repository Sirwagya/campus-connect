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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { Button } from "./ui/Button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

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

  useEffect(() => {
    async function fetchAvatar() {
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      } else if (user.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    }

    fetchAvatar();
  }, [user]);

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden h-screen flex-col border-r border-[#1f1f1f] bg-black md:flex sticky top-0 z-50"
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
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(155,92,255,0.3)]">
                <span className="font-bold text-white text-lg">C</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                Campus Connect
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-muted-foreground hover:text-white hover:bg-transparent p-0"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

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
                "flex items-center gap-4 px-4 py-3 rounded-md transition-all group relative overflow-hidden",
                isActive
                  ? "bg-[#282828] text-white font-medium"
                  : "text-muted-foreground hover:text-white hover:bg-[#121212]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full shadow-[0_0_10px_#9b5cff]"
                />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-primary" : "group-hover:text-white"
                )}
              />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap"
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
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
                    "flex items-center gap-4 px-4 py-3 rounded-md transition-all group relative overflow-hidden",
                    isActive
                      ? "bg-[#282828] text-white font-medium"
                      : "text-muted-foreground hover:text-white hover:bg-[#121212]"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="whitespace-nowrap"
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
      <div className="p-4 bg-black/50 backdrop-blur-xl border-t border-[#1f1f1f]">
        {user ? (
          <Link
            href={`/profile/${user.id}`}
            className={cn(
              "flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-[#282828] group",
              isCollapsed && "justify-center"
            )}
          >
            <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-transparent group-hover:border-primary transition-colors">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.email || "User"}
                  className="aspect-square h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#282828] text-muted-foreground">
                  <UserIcon className="h-5 w-5" />
                </div>
              )}
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex flex-col overflow-hidden min-w-0"
                >
                  <span className="text-sm font-bold truncate text-white group-hover:text-primary transition-colors">
                    {user.email?.split("@")[0]}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    View Profile
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        ) : (
          !isCollapsed && (
            <div className="px-2 mb-4 text-sm text-muted-foreground">
              Not signed in
            </div>
          )
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-white hover:bg-transparent mt-2",
            isCollapsed && "justify-center px-0"
          )}
          onClick={signOut}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
