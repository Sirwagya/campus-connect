"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, RefreshCw, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertSidebar } from "@/components/alerts/AlertSidebar";
import { AlertItem } from "@/components/alerts/AlertItem";
import { AnimatePresence, motion } from "framer-motion";

interface Alert {
  id: number;
  gmail_id: string;
  from_email: string;
  subject: string;
  snippet: string;
  received_at: string;
  starred: boolean;
  unread: boolean;
}

interface Notification {
  id: string;
  type: "space_invite" | "system";
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all" && activeTab !== "notifications")
        params.append("filter", activeTab);
      if (search) params.append("q", search);

      const res = await fetch(`/api/alerts?${params.toString()}`);
      const data = await res.json();
      if (data.alerts) {
        setAlerts(data.alerts);
      }

      // Fetch Notifications
      const notifRes = await fetch("/api/notifications");
      const notifData = await notifRes.json();
      if (notifData.notifications) {
        setNotifications(
          notifData.notifications.map((n: any) => ({
            ...n,
            is_read: n.read, // Map DB column 'read' to frontend 'is_read'
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch alerts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/alerts/sync", { method: "POST" });
      await fetchAlerts();
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Auto-sync every minute
    const interval = setInterval(() => {
      handleSync();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [activeTab, search]);

  const handleAcceptInvite = async (notification: Notification) => {
    try {
      // 1. Join Space
      const res = await fetch(
        `/api/spaces/${notification.data.space_slug}/join`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join space");
      }

      // 2. Mark Notification as Read
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id, is_read: true }),
      });

      alert("Successfully joined space!");
      fetchAlerts(); // Refresh
    } catch (error: any) {
      alert(error.message);
    }
  };

  const unreadCount = alerts.filter((a) => a.unread).length;
  const notificationCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center px-4 gap-4 bg-[#18181B]">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
        {/* Sidebar */}
        <AlertSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadCount={unreadCount}
          notificationCount={notificationCount}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#0E0E10] rounded-tl-2xl border-l border-t border-white/5 mt-2 mr-2 mb-2 p-0">
          {activeTab === "notifications" ? (
            <div className="p-4 space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-4 rounded-lg border border-white/5 flex items-center justify-between",
                      !n.is_read ? "bg-[#18181B]" : "opacity-70"
                    )}
                  >
                    <div>
                      <h3 className="font-bold text-white">{n.title}</h3>
                      <p className="text-gray-400 text-sm">{n.message}</p>
                    </div>
                    {n.type === "space_invite" &&
                      (n.is_read ? (
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
                          onClick={() => handleAcceptInvite(n)}
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
                <div className="text-center py-20 text-gray-500">
                  Loading...
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  No messages found
                </div>
              ) : (
                <AnimatePresence>
                  {alerts.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onToggleStar={async (id) => {
                        // Optimistic update
                        setAlerts(
                          alerts.map((a) =>
                            a.id === id ? { ...a, starred: !a.starred } : a
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
                          // Revert on error
                          setAlerts(
                            alerts.map((a) =>
                              a.id === id ? { ...a, starred: !a.starred } : a
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
