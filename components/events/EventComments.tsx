"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { EventComment } from "@/types/events";
import { Loader2, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface EventCommentsProps {
  eventId: string;
  currentUser: any;
}

export function EventComments({ eventId, currentUser }: EventCommentsProps) {
  const [comments, setComments] = useState<EventComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/comments`);
        const data = await res.json();
        if (data.comments) {
          setComments(data.comments);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();
      if (res.ok) {
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
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Discussion</h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-4">
        <Avatar
          src={currentUser?.user_metadata?.avatar_url}
          fallback={currentUser?.user_metadata?.full_name?.[0]}
          className="h-10 w-10"
        />
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add to the discussion..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button disabled={!newComment.trim() || isSending}>
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Post Comment
            </Button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to start the discussion!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Link href={`/profile/${comment.user_id}`}>
                <Avatar
                  src={comment.user?.avatar_url}
                  fallback={comment.user?.name?.[0]}
                  className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/profile/${comment.user_id}`}
                    className="font-semibold hover:underline cursor-pointer"
                  >
                    {comment.user?.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                  {comment.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
