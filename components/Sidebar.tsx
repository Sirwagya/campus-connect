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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { Button } from "./ui/Button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/spaces", label: "Spaces", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/alerts", label: "Alerts", icon: Mail },
];

const adminNavItems = [
  { href: "/admin/events", label: "Manage Events", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, isAdmin } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
    <aside className="hidden h-screen w-64 flex-col border-r bg-background md:flex fixed left-0 top-0">
      <div className="flex h-14 items-center border-b px-6">
        <span className="text-lg font-bold tracking-tight">CAMPUS CONNECT</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {/* Admin Links */}
        {isAdmin && (
          <>
            <div className="my-4 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
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
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
      <div className="border-t p-4">
        {user ? (
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center gap-3 px-2 mb-4 hover:bg-accent/50 p-2 rounded-md transition-colors cursor-pointer"
          >
            <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.email || "User"}
                  className="aspect-square h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {user.email?.split("@")[0]}
              </span>
              <span className="text-xs text-muted-foreground">Student</span>
            </div>
          </Link>
        ) : (
          <div className="px-2 mb-4 text-sm text-muted-foreground">
            Not signed in
          </div>
        )}
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
