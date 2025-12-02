"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, RefreshCw, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertSidebar } from "@/components/alerts/AlertSidebar";
import { AlertItem } from "@/components/alerts/AlertItem";
import { AnimatePresence } from "framer-motion";
import type {
  Alert,
  Notification,
  NotificationPayload,
  AlertFilter,
} from "@/types/alerts";

const SYNC_INTERVAL_MS = 60 * 1000;

type NotificationApiResponse = Omit<Notification, "is_read" | "data"> & {
  is_read?: boolean | null;
  read?: boolean | null;
  data?: NotificationPayload | null;
};

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<AlertFilter>("all");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all" && activeTab !== "notifications") {
        params.append("filter", activeTab);
      }
      if (search) {
        params.append("q", search);
      }

      const res = await fetch(`/api/alerts?${params.toString()}`);
      const data = await res.json();
      if (data.alerts) {
        setAlerts(data.alerts as Alert[]);
      }

      const notifRes = await fetch("/api/notifications");
      const notifData = await notifRes.json();
      if (notifData.notifications) {
        setNotifications(
          notifData.notifications.map(
            (notification: NotificationApiResponse): Notification => ({
              ...notification,
              data: notification.data ?? {},
              is_read: notification.read ?? notification.is_read ?? false,
            })
          )
        );
      }
    } catch (error) {
      console.error("Failed to fetch alerts", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("/api/alerts/sync", { method: "POST" });
      await fetchAlerts();
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setSyncing(false);
    }
  }, [fetchAlerts]);

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(() => {
      void handleSync();
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchAlerts, handleSync]);

  const handleAcceptInvite = useCallback(
    async (notification: Notification) => {
      const spaceSlug = notification.data?.space_slug;
      if (!spaceSlug) {
        alert("This invite is missing space information.");
        return;
      }

      try {
        const res = await fetch(`/api/spaces/${spaceSlug}/join`, {
          method: "POST",
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to join space");
        }

        // Mark notification as read
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notification.id, is_read: true }),
        });

        // Optimistically update the notification state immediately
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );

        alert("Successfully joined space!");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to join space";
        alert(message);
      }
    },
    []
  );

  const unreadCount = alerts.filter((alert) => alert.unread).length;
  const notificationCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="h-16 border-b border-white/10 flex items-center px-4 gap-4 bg-[#18181B]">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-pressed={isSidebarOpen}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold hidden md:block">CampusMail</h1>

        <div className="flex-1 max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mail..."
            className="pl-10 bg-[#27272a] border-none text-white focus-visible:ring-1 focus-visible:ring-white/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSync}
          disabled={syncing}
          className="text-gray-400 hover:text-white"
        >
          <RefreshCw className={cn("h-5 w-5", syncing && "animate-spin")} />
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <AlertSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadCount={unreadCount}
          notificationCount={notificationCount}
        />

        <main className="flex-1 overflow-y-auto bg-[#0E0E10] rounded-tl-2xl border-l border-t border-white/5 mt-2 mr-2 mb-2 p-0">
          {activeTab === "notifications" ? (
            <div className="p-4 space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No notifications</div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 rounded-lg border border-white/5 flex items-center justify-between",
                      !notification.is_read ? "bg-[#18181B]" : "opacity-70"
                    )}
                  >
                    <div>
                      <h3 className="font-bold text-white">{notification.title}</h3>
                      <p className="text-gray-400 text-sm">{notification.message}</p>
                    </div>
                    {notification.type === "space_invite" &&
                      (notification.is_read ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="text-green-500 border-green-500/50 bg-green-500/10"
                        >
                          Joined
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvite(notification)}
                          className="bg-primary text-white hover:bg-primary/90"
                        >
                          Accept
                        </Button>
                      ))}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="text-center py-20 text-gray-500">Loading...</div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No messages found</div>
              ) : (
                <AnimatePresence>
                  {alerts.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onToggleStar={async (id) => {
                        setAlerts((prev) =>
                          prev.map((existing) =>
                            existing.id === id
                              ? { ...existing, starred: !existing.starred }
                              : existing
                          )
                        );
                        try {
                          await fetch(`/api/alerts/${id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ starred: !alert.starred }),
                          });
                        } catch (error) {
                          console.error("Failed to toggle star", error);
                          setAlerts((prev) =>
                            prev.map((existing) =>
                              existing.id === id
                                ? { ...existing, starred: !existing.starred }
                                : existing
                            )
                          );
                        }
                      }}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
