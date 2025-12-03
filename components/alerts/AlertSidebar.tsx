"use client";

import { Button } from "@/components/ui/Button";
import {
  Inbox,
  Star,
  Send,
  File,
  AlertCircle,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertFilter } from "@/types/alerts";

interface AlertSidebarProps {
  activeTab: AlertFilter;
  onTabChange: (tab: AlertFilter) => void;
  unreadCount?: number;
  notificationCount?: number;
}

export function AlertSidebar({
  activeTab,
  onTabChange,
  unreadCount = 0,
  notificationCount = 0,
}: AlertSidebarProps) {
  const items: Array<{
    id: AlertFilter;
    label: string;
    icon: LucideIcon;
    count?: number;
    color?: string;
  }> = [
    { id: "all", label: "Inbox", icon: Inbox, count: unreadCount },
    { id: "starred", label: "Starred", icon: Star },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      count: notificationCount,
      color: "text-red-400",
    },
    { id: "sent", label: "Sent", icon: Send },
    { id: "drafts", label: "Drafts", icon: File },
    { id: "spam", label: "Spam", icon: AlertCircle },
  ];

  return (
    <div className="w-64 flex-shrink-0 hidden md:block pr-4">
      <div className="space-y-1">
        {items.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start rounded-r-full rounded-l-none pl-6 font-medium h-10 transition-all duration-300",
              activeTab === item.id
                ? "bg-primary/20 text-primary border-l-2 border-primary" // Active state: glass purple
                : "text-white/40 hover:text-white hover:bg-white/5"
            )}
            onClick={() => onTabChange(item.id)}
          >
            <item.icon className={cn("mr-3 h-4 w-4", item.color)} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.count ? (
              <span className="text-xs font-bold ml-2">{item.count}</span>
            ) : null}
          </Button>
        ))}
      </div>
    </div>
  );
}
