"use client";

import { Star, Trash2, Mail, MailOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Alert } from "@/types/alerts";

interface AlertItemProps {
  alert: Alert;
  onToggleStar?: (id: number) => void;
}

export function AlertItem({ alert, onToggleStar }: AlertItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "group flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer",
        alert.unread
          ? "bg-[#18181B] text-white"
          : "bg-transparent text-gray-400"
      )}
    >
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 hover:bg-white/10 rounded-full",
            alert.starred
              ? "text-yellow-400"
              : "text-gray-600 group-hover:text-gray-400"
          )}
          onClick={() => onToggleStar?.(alert.id)}
        >
          <Star className={cn("h-4 w-4", alert.starred && "fill-current")} />
        </Button>
      </div>

      <Link
        href={`/alerts/${alert.id}`}
        className="flex-1 flex items-center gap-4 min-w-0"
      >
        <div
          className={cn(
            "w-48 truncate font-medium",
            alert.unread ? "text-white" : "text-gray-400"
          )}
        >
          {(() => {
            const from = alert.from_email;
            const match = from.match(/^"?([^"<]+)"?\s*<.+>$/);
            return match ? match[1].trim() : from;
          })()}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span
            className={cn(
              "truncate",
              alert.unread ? "font-semibold text-white" : "text-gray-400"
            )}
          >
            {alert.subject}
          </span>
          <span className="text-gray-600 text-sm truncate hidden md:inline">
            - {alert.snippet}
          </span>
        </div>

        <div className="text-xs text-gray-500 whitespace-nowrap w-20 text-right group-hover:hidden">
          {new Date(alert.received_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </div>
      </Link>

      <div
        className="hidden group-hover:flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
        >
          {alert.unread ? (
            <MailOpen className="h-4 w-4" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}
