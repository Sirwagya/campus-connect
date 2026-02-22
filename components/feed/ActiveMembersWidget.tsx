"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronRight, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { useProfilePopout } from "@/components/profile/ProfilePopoutProvider";

interface ActiveUser {
  user_id: string;
  status: string;
  last_seen: string | null;
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ActiveMembersWidgetProps {
  maxItems?: number;
}

export function ActiveMembersWidget({
  maxItems = 6,
}: ActiveMembersWidgetProps) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openMiniProfile } = useProfilePopout();

  const fetchActiveUsers = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/presence");
      if (!res.ok) {
        console.error("Presence API error:", res.status);
        setActiveUsers([]);
        return;
      }
      const { data } = await res.json();
      setActiveUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch active users:", err);
      setActiveUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveUsers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveUsers]);

  const handleUserClick = (userId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openMiniProfile(userId, rect);
  };

  const displayedUsers = activeUsers.slice(0, maxItems);
  const remainingCount = activeUsers.length - maxItems;

  return (
    <div
      className="bg-white/[0.03] backdrop-blur-xl rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-sm font-medium text-white">Active Now</h3>
          <span className="text-xs text-white/40">({activeUsers.length})</span>
        </div>
        <button
          onClick={fetchActiveUsers}
          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 min-h-[120px]">
        {loading && activeUsers.length === 0 ? (
          // Loading skeleton
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
                  <div className="h-2 w-14 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <p className="text-sm text-white/40 mb-2">{error}</p>
            <button
              onClick={fetchActiveUsers}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : activeUsers.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <Users className="w-8 h-8 text-white/20 mb-2" />
            <p className="text-sm text-white/40">No one online</p>
          </div>
        ) : (
          // User list
          <AnimatePresence mode="popLayout">
            <div className="space-y-1">
              {displayedUsers.map((item, index) => {
                const displayName =
                  item.profile?.display_name || item.user?.full_name || "User";
                const username =
                  item.profile?.username ||
                  item.user?.full_name?.toLowerCase().replace(/\s/g, "") ||
                  "user";
                const avatarUrl =
                  item.profile?.avatar_url || item.user?.avatar_url;

                return (
                  <motion.button
                    key={item.user_id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={(e) => handleUserClick(item.user_id, e)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group text-left"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="bg-white/10 text-white text-xs">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0d0d12] ${
                          item.status === "online"
                            ? "bg-green-500"
                            : item.status === "away"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        @{username}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* View All Footer */}
      {remainingCount > 0 && (
        <div className="px-4 py-2 border-t border-white/5">
          <button className="w-full text-xs text-white/50 hover:text-white transition-colors text-center">
            +{remainingCount} more online
          </button>
        </div>
      )}
    </div>
  );
}
