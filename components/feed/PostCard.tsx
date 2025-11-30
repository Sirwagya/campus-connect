"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { CommentList } from "./CommentList";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import Link from "next/link";

interface PostCardProps {
  post: any;
  currentUserId?: string;
  currentUser?: any; // Added to pass full user profile to comments
}

export function PostCard({ post, currentUserId, currentUser }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((prev: number) => (newLiked ? prev + 1 : prev - 1));
    setIsLiking(true);

    try {
      const res = await fetch("/api/feed/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });

      if (!res.ok) throw new Error("Failed to like");
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setLikesCount((prev: number) => (!newLiked ? prev + 1 : prev - 1));
      console.error("Like error:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    // Optimistic hide
    setIsDeleted(true);

    try {
      const res = await fetch(`/api/feed/delete?postId=${post.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setIsDeleted(false); // Revert if failed
      alert("Failed to delete post");
    }
  };

  if (isDeleted) return null;

  const isOwner = currentUserId === post.user_id;

  return (
    <div
      className={cn(
        "p-4 border-b hover:bg-accent/5 transition-colors",
        post.isOptimistic && "opacity-70"
      )}
    >
      <div className="flex gap-3">
        <Link href={`/profile/${post.user_id}`}>
          <Avatar
            src={post.user?.avatar_url}
            fallback={post.user?.name?.[0] || post.user?.email?.[0] || "?"}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Link
                href={`/profile/${post.user_id}`}
                className="font-bold hover:underline cursor-pointer"
              >
                {post.user?.full_name || post.user?.name || "Unknown"}
              </Link>
              <span className="text-muted-foreground">
                @{post.user?.email?.split("@")[0]}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground hover:underline cursor-pointer">
                {post.created_at && !isNaN(new Date(post.created_at).getTime())
                  ? formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                    })
                  : "Just now"}
              </span>
            </div>

            {isOwner && (
              <DropdownMenu
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownMenuItem onClick={handleDelete} variant="destructive">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Post</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenu>
            )}
            {!isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div
            className="mt-1 text-base whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: post.content }} // Content is sanitized on server
          />

          {post.attachments && post.attachments.length > 0 && (
            <div
              className={cn(
                "mt-3 grid gap-2 rounded-xl overflow-hidden border",
                post.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"
              )}
            >
              {post.attachments.map((att: any, i: number) => (
                <img
                  key={i}
                  src={att.url}
                  alt="Attachment"
                  className="w-full h-auto object-cover max-h-[500px]"
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 max-w-md text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className={cn(
                "group hover:text-blue-500 p-0 h-8 w-auto min-w-[2rem] rounded-full flex gap-2 px-2",
                showComments && "text-blue-500"
              )}
            >
              <MessageCircle
                className={cn(
                  "h-4 w-4 group-hover:bg-blue-500/10 rounded-full",
                  showComments && "fill-current"
                )}
              />
              <span className="text-xs group-hover:text-blue-500">
                {commentsCount}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "group hover:text-pink-500 p-0 h-8 w-auto min-w-[2rem] rounded-full flex gap-2 px-2",
                liked && "text-pink-500"
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4 group-hover:bg-pink-500/10 rounded-full",
                  liked && "fill-current"
                )}
              />
              <span className="text-xs group-hover:text-pink-500">
                {likesCount}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="group hover:text-green-500 p-0 h-8 w-auto min-w-[2rem] rounded-full flex gap-2 px-2"
            >
              <Share2 className="h-4 w-4 group-hover:bg-green-500/10 rounded-full" />
              <span className="text-xs group-hover:text-green-500">
                {post.shares_count || 0}
              </span>
            </Button>
          </div>

          {showComments && (
            <CommentList
              postId={post.id}
              currentUser={currentUser}
              onCommentAdded={() =>
                setCommentsCount((prev: number) => prev + 1)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
