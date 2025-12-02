"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { FeedComment, FeedUser } from "@/types/feed";

interface CommentListProps {
  postId: string;
  currentUser?: FeedUser;
  onCommentAdded?: () => void;
}

export function CommentList({
  postId,
  currentUser,
  onCommentAdded,
}: CommentListProps) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/feed/comments?postId=${postId}`);
      const data = (await res.json()) as { comments?: FeedComment[] };
      if (data.comments) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    setLoading(true);
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/feed/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: newComment.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to post comment");

      const { comment } = (await res.json()) as { comment: FeedComment };

      setComments((prev) => [...prev, comment]);
      setNewComment("");
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error("Failed to post comment:", error);
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-4 border-t mt-4 space-y-4">
      {/* Comment Input */}
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={currentUser?.avatar_url || undefined}
            alt={currentUser?.name || currentUser?.email || "User"}
          />
          <AvatarFallback>
            {currentUser?.name?.[0] || currentUser?.email?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[40px] h-[40px] py-2 resize-none"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Link href={`/profile/${comment.user_id}`}>
                <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage
                    src={comment.user?.avatar_url || undefined}
                    alt={comment.user?.name || comment.user?.email || "User"}
                  />
                  <AvatarFallback>
                    {comment.user?.name?.[0] || comment.user?.email?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <Link
                    href={`/profile/${comment.user_id}`}
                    className="font-semibold text-sm hover:underline cursor-pointer"
                  >
                    {comment.user?.full_name || comment.user?.name || "Unknown"}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {comment.created_at
                      ? formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                        })
                      : "just now"}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-2">
              No comments yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
