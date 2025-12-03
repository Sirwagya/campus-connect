"use client";

import { Mail } from "@/types/mail";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface MailItemProps {
  mail: Mail;
  onClick: () => void;
}

export function MailItem({ mail, onClick }: MailItemProps) {
  const [isStarred, setIsStarred] = useState(mail.is_starred);

  const handleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isStarred;
    setIsStarred(newState);

    try {
      await fetch("/api/mail/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mail.id, action: "star", value: newState }),
      });
    } catch (error) {
      console.error("Failed to toggle star", error);
      setIsStarred(!newState); // Revert on error
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer transition-colors",
        !mail.is_read && "bg-white/[0.02]"
      )}
    >
      <button
        onClick={handleStar}
        className="text-gray-500 hover:text-yellow-400 focus:outline-none"
      >
        <Star
          className={cn(
            "h-5 w-5 transition-colors",
            isStarred ? "fill-yellow-400 text-yellow-400" : "text-gray-600"
          )}
        />
      </button>

      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
        <div
          className={cn(
            "col-span-3 truncate font-medium",
            !mail.is_read ? "text-white" : "text-gray-400"
          )}
        >
          {mail.from}
        </div>
        <div className="col-span-7 truncate text-gray-400">
          <span
            className={cn(
              "text-gray-300",
              !mail.is_read && "font-semibold text-white"
            )}
          >
            {mail.subject}
          </span>
          <span className="mx-2 text-gray-600">-</span>
          <span className="text-gray-500">{mail.body}</span>
        </div>
        <div className="col-span-2 text-right text-xs text-gray-500">
          {formatDistanceToNow(new Date(mail.timestamp), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}
