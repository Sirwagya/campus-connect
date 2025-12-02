"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { EventComment } from "@/types/events";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EventCommentsProps {
  eventId: string;
  currentUser?: {
    id: string;
    user_metadata?: {
      avatar_url?: string | null;
      full_name?: string | null;
    };
  } | null;
}

interface CommentsResponse {
  comments?: EventComment[];
  error?: string;
}

interface CommentResponse {
  comment: EventComment;
  error?: string;
}

export function EventComments({ eventId, currentUser }: EventCommentsProps) {
  const [comments, setComments] = useState<EventComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}/comments`);
        const data = (await res.json()) as CommentsResponse;
        if (!isMounted) return;
        if (res.ok && data.comments) {
          setComments(data.comments);
        } else if (!res.ok) {
          console.error("Failed to fetch comments:", data.error);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching comments:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchComments();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      const data = (await res.json()) as CommentResponse;
      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment");
      }

      if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 pb-4 border-b border-[#1f1f1f]">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold">Discussion</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          {comments.length} comments
        </span>
      </div>

      {/* Comment Form */}
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border border-[#27272a]">
          <AvatarImage
            src={currentUser?.user_metadata?.avatar_url ?? undefined}
            alt={currentUser?.user_metadata?.full_name || "User"}
          />
          <AvatarFallback>
            {currentUser?.user_metadata?.full_name?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          <div
            className={cn(
              "border rounded-xl overflow-hidden transition-all duration-200 bg-[#131313]",
              isFocused
                ? "border-primary ring-1 ring-primary/20 shadow-[0_0_15px_rgba(155,92,255,0.1)]"
                : "border-[#27272a]"
            )}
          >
            <div className="bg-[#18181B] px-4 py-2 border-b border-[#27272a] flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Write
              </span>
            </div>
            <Textarea
              placeholder="Add to the discussion..."
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="min-h-[100px] border-none focus-visible:ring-0 bg-transparent resize-y p-4"
            />
            <div className="bg-[#18181B] px-4 py-2 border-t border-[#27272a] flex justify-end">
              <Button
                disabled={!newComment.trim() || isSending}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white font-medium"
                onClick={handleSubmit}
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Send className="mr-2 h-3 w-3" />
                )}
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#27272a] rounded-xl bg-[#131313]/50">
            <p className="text-muted-foreground">
              No comments yet. Be the first to start the discussion!
            </p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-[#27272a]">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 relative group">
                <Link
                  href={`/profile/${comment.user_id}`}
                  className="relative z-10"
                >
                  <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all border border-[#27272a] bg-[#131313]">
                    <AvatarImage
                      src={comment.user?.avatar_url ?? undefined}
                      alt={comment.user?.name || "User"}
                    />
                    <AvatarFallback>
                      {comment.user?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="border border-[#27272a] rounded-xl bg-[#131313] overflow-hidden group-hover:border-[#3f3f46] transition-colors">
                    <div className="bg-[#18181B] px-4 py-2 border-b border-[#27272a] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${comment.user_id}`}
                          className="font-semibold text-sm hover:text-primary transition-colors"
                        >
                          {comment.user?.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          commented{" "}
                          {formatDistanceToNow(
                            new Date(comment.created_at),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-[#27272a] text-[10px] text-muted-foreground font-mono">
                          Member
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
