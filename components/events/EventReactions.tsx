"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

interface EventReactionsProps {
  eventId: string;
  currentUser?: { id: string } | null;
}

const REACTION_EMOJIS = ["👍", "❤️", "🎉", "🔥", "👏"] as const;
type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

interface ReactionToggleResponse {
  added: boolean;
  error?: string;
}

export function EventReactions({ eventId, currentUser }: EventReactionsProps) {
  const initialCounts = useMemo(
    () =>
      Object.fromEntries(
        REACTION_EMOJIS.map((emoji) => [emoji, 0])
      ) as Record<ReactionEmoji, number>,
    []
  );

  const [counts, setCounts] = useState<Record<ReactionEmoji, number>>(initialCounts);
  const [userReactions, setUserReactions] = useState<Set<ReactionEmoji>>(new Set());

  const handleReaction = async (emoji: ReactionEmoji) => {
    if (!currentUser) {
      alert("Please login to react");
      return;
    }

    // Optimistic update
    const isActive = userReactions.has(emoji);
    setUserReactions((prev) => {
      const next = new Set(prev);
      if (isActive) next.delete(emoji);
      else next.add(emoji);
      return next;
    });

    const delta = isActive ? -1 : 1;
    setCounts((prev) => ({
      ...prev,
      [emoji]: Math.max((prev[emoji] ?? 0) + delta, 0),
    }));

    try {
      const res = await fetch(`/api/events/${eventId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: emoji }),
      });
      const data = (await res.json()) as ReactionToggleResponse;

      if (!res.ok || typeof data.added !== "boolean") {
        throw new Error(data.error || "Failed to toggle reaction");
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      // Revert optimistic update
      setUserReactions((prev) => {
        const next = new Set(prev);
        if (isActive) next.add(emoji);
        else next.delete(emoji);
        return next;
      });
      setCounts((prev) => ({
        ...prev,
        [emoji]: Math.max((prev[emoji] ?? 0) - delta, 0),
      }));
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {REACTION_EMOJIS.map((emoji) => {
        const count = counts[emoji] ?? 0;
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
