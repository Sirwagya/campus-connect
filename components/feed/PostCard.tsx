"use client";

import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface PostCardProps {
  post: any;
  currentUserId?: string;
  currentUser?: any;
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
      setLiked(!newLiked);
      setLikesCount((prev: number) => (!newLiked ? prev + 1 : prev - 1));
      console.error("Like error:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

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
      setIsDeleted(false);
      alert("Failed to delete post");
    }
  };

  if (isDeleted) return null;

  const isOwner = currentUserId === post.user_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mb-6 rounded-xl bg-white/[0.03] border border-white/5 p-5 transition-all hover:bg-white/[0.05] hover:border-white/10 shadow-sm",
        post.isOptimistic && "opacity-70"
      )}
    >
      <div className="flex gap-4">
        <Link href={`/profile/${post.user_id}`}>
          <Avatar
            src={post.user?.avatar_url}
            fallback={post.user?.name?.[0] || post.user?.email?.[0] || "?"}
            className="cursor-pointer hover:opacity-80 transition-opacity h-11 w-11 border border-white/10 shadow-sm"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-[15px]">
              <Link
                href={`/profile/${post.user_id}`}
                className="font-bold text-white hover:underline cursor-pointer hover:text-[#a970ff] transition-colors"
              >
                {post.user?.full_name || post.user?.name || "Unknown"}
              </Link>
              <span className="text-gray-500 text-sm">
                @{post.user?.email?.split("@")[0]}
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-500 text-xs hover:underline cursor-pointer">
                {post.created_at && !isNaN(new Date(post.created_at).getTime())
                  ? formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                    })
                  : "Just now"}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/5 rounded-full"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#18181B] border-white/10 text-white"
              >
                {isOwner && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Post</span>
                    </div>
                  </DropdownMenuItem>
                )}
                {!isOwner && (
                  <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">
                    <span>Report Post</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div
            className="text-[15px] leading-relaxed text-gray-200 whitespace-pre-wrap break-words mb-4 font-normal"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.attachments && post.attachments.length > 0 && (
            <div
              className={cn(
                "mb-4 grid gap-2 rounded-xl overflow-hidden border border-white/5",
                post.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"
              )}
            >
              {post.attachments.map((att: any, i: number) => (
                <img
                  key={i}
                  src={att.url}
                  alt="Attachment"
                  className="w-full h-auto object-cover max-h-[500px] bg-black/50 hover:scale-[1.02] transition-transform duration-500"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className={cn(
                "group hover:bg-blue-500/10 hover:text-blue-400 p-0 h-8 w-auto min-w-[2rem] rounded-full flex gap-2 px-2 text-gray-500 transition-all",
                showComments && "text-blue-400"
              )}
            >
              <MessageCircle
                className={cn(
                  "h-4.5 w-4.5 group-hover:scale-110 transition-transform",
                  showComments && "fill-current"
                )}
              />
              <span className="text-xs font-medium">
                {commentsCount > 0 ? commentsCount : ""}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "group hover:bg-pink-500/10 hover:text-pink-400 p-0 h-8 w-auto min-w-[2rem] rounded-full flex gap-2 px-2 text-gray-500 transition-all",
                liked && "text-pink-400"
              )}
            >
              <Heart
                className={cn(
                  "h-4.5 w-4.5 group-hover:scale-110 transition-transform",
                  liked && "fill-current"
                )}
              />
              <span className="text-xs font-medium">
                {likesCount > 0 ? likesCount : ""}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="group hover:bg-green-500/10 hover:text-green-400 p-0 h-8 w-auto min-w-[2rem] rounded-full flex gap-2 px-2 text-gray-500 transition-all"
            >
              <Share2 className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">
                {post.shares_count > 0 ? post.shares_count : ""}
              </span>
            </Button>
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-white/5">
                  <CommentList
                    postId={post.id}
                    currentUser={currentUser}
                    onCommentAdded={() =>
                      setCommentsCount((prev: number) => prev + 1)
                    }
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
