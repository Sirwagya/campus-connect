"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { EventReaction } from "@/types/events";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface EventReactionsProps {
  eventId: string;
  currentUser: any;
}

const REACTION_EMOJIS = ["👍", "❤️", "🎉", "🔥", "👏"];

export function EventReactions({ eventId, currentUser }: EventReactionsProps) {
  const [reactions, setReactions] = useState<EventReaction[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch initial reactions (we might want a dedicated endpoint for counts later)
    // For now, we'll just assume we load them or start empty/optimistic
  }, []);

  const handleReaction = async (emoji: string) => {
    if (!currentUser) return alert("Please login to react");

    // Optimistic update
    const isActive = userReactions.has(emoji);
    setUserReactions((prev) => {
      const next = new Set(prev);
      if (isActive) next.delete(emoji);
      else next.add(emoji);
      return next;
    });

    setCounts((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + (isActive ? -1 : 1),
    }));

    try {
      await fetch(`/api/events/${eventId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: emoji }),
      });
    } catch (error) {
      console.error("Error toggling reaction:", error);
      // Revert on error (omitted for brevity)
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {REACTION_EMOJIS.map((emoji) => {
        const count = counts[emoji] || 0;
        const isActive = userReactions.has(emoji);

        return (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleReaction(emoji)}
            className={cn(
              "relative flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-300",
              isActive
                ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(155,92,255,0.3)]"
                : "bg-[#18181B] border-[#27272a] text-muted-foreground hover:bg-[#27272a] hover:text-white hover:border-white/20"
            )}
          >
            <span className="text-xl">{emoji}</span>
            {count > 0 && (
              <span
                className={cn(
                  "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full border",
                  isActive
                    ? "bg-primary text-white border-primary"
                    : "bg-[#27272a] text-white border-[#18181B]"
                )}
              >
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
