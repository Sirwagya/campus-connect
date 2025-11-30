"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, Star, Inbox, MailOpen, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  const [activeTab, setActiveTab] = useState<
    "all" | "unread" | "starred" | "notifications"
  >("all");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("filter", activeTab);
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
        setNotifications(notifData.notifications);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("all")}
          className="gap-2"
        >
          <Inbox className="h-4 w-4" /> All
        </Button>
        <Button
          variant={activeTab === "unread" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("unread")}
          className="gap-2"
        >
          <MailOpen className="h-4 w-4" /> Unread
        </Button>
        <Button
          variant={activeTab === "starred" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("starred")}
          className="gap-2"
        >
          <Star className="h-4 w-4" /> Starred
        </Button>
        <Button
          variant={activeTab === "notifications" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("notifications")}
          className="gap-2"
        >
          <Inbox className="h-4 w-4" /> Notifications
          {notifications.filter((n) => !n.is_read).length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">
              {notifications.filter((n) => !n.is_read).length}
            </span>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        {activeTab === "notifications" ? (
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <Card
                  key={n.id}
                  className={cn(
                    "transition-colors",
                    !n.is_read && "bg-accent/10"
                  )}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{n.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {n.type === "space_invite" && !n.is_read && (
                      <Button size="sm" onClick={() => handleAcceptInvite(n)}>
                        Accept Invite
                      </Button>
                    )}
                    {n.is_read && (
                      <span className="text-xs text-muted-foreground">
                        Read
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No alerts found.
          </div>
        ) : (
          alerts.map((email) => (
            <Link key={email.id} href={`/alerts/${email.id}`}>
              <Card
                className={cn(
                  "cursor-pointer transition-colors hover:bg-accent/50",
                  email.unread && "bg-accent/10"
                )}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      email.starred ? "text-black" : "text-muted-foreground"
                    )}
                  >
                    <Star
                      className="h-4 w-4"
                      fill={email.starred ? "currentColor" : "none"}
                    />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          email.unread && "font-bold"
                        )}
                      >
                        {(() => {
                          const from = email.from_email;
                          // Extract name from "Name <email>" format
                          const match = from.match(/^"?([^"<]+)"?\s*<.+>$/);
                          return match ? match[1].trim() : from;
                        })()}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {new Date(email.received_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm truncate",
                        email.unread && "font-semibold"
                      )}
                    >
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {email.snippet}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
