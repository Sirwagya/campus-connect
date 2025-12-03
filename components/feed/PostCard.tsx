"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Bookmark,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { CommentList } from "./CommentList";
import { ReactionButton, ReactionSummary } from "./ReactionButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { FeedPost, FeedUser } from "@/types/feed";

interface PostCardProps {
  post: FeedPost;
  currentUserId?: string;
  currentUser?: FeedUser;
}

export function PostCard({ post, currentUserId, currentUser }: PostCardProps) {
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
        "mb-6 rounded-2xl glass-panel p-5 transition-all hover:bg-white/10 hover:border-white/20",
        post.isOptimistic && "opacity-70"
      )}
    >
      <div className="flex gap-4">
        <Link href={`/profile/${post.user_id}`}>
          <Avatar className="cursor-pointer hover:opacity-80 transition-opacity h-11 w-11 border border-white/10 shadow-sm">
            <AvatarImage
              src={post.user?.avatar_url || undefined}
              alt={post.user?.name || post.user?.email || "User"}
            />
            <AvatarFallback>
              {post.user?.name?.[0] || post.user?.email?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
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
                @{post.user?.email?.split("@")[0] || "anonymous"}
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
              {post.attachments.map((att, i: number) => (
                <Image
                  key={`${att.url}-${i}`}
                  src={att.url}
                  alt={att.name || "Attachment"}
                  width={800}
                  height={600}
                  sizes="(max-width: 768px) 100vw, 720px"
                  className="w-full h-auto object-cover max-h-[500px] bg-black/50 hover:scale-[1.02] transition-transform duration-500"
                  unoptimized
                />
              ))}
            </div>
          )}

          {/* Reaction Summary */}
          <ReactionSummary
            targetType="post"
            targetId={post.id}
            className="mb-2"
          />

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {/* Reactions */}
              <ReactionButton targetType="post" targetId={post.id} />

              {/* Comments */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className={cn(
                  "group hover:bg-blue-500/10 hover:text-blue-400 p-0 h-8 w-auto min-w-[2rem] rounded-full flex gap-2 px-3 text-gray-500 transition-all",
                  showComments && "text-blue-400"
                )}
              >
                <MessageCircle
                  className={cn(
                    "h-4 w-4 group-hover:scale-110 transition-transform",
                    showComments && "fill-current"
                  )}
                />
                <span className="text-xs font-medium">
                  {commentsCount > 0 ? commentsCount : ""}
                </span>
              </Button>

              {/* Share */}
              <Button
                variant="ghost"
                size="sm"
                className="group hover:bg-green-500/10 hover:text-green-400 p-0 h-8 w-auto min-w-[2rem] rounded-full flex gap-2 px-3 text-gray-500 transition-all"
              >
                <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">
                  {post.shares_count && post.shares_count > 0
                    ? post.shares_count
                    : ""}
                </span>
              </Button>
            </div>

            {/* Save/Bookmark */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSaved(!isSaved)}
              className={cn(
                "group hover:bg-yellow-500/10 hover:text-yellow-400 p-0 h-8 w-8 rounded-full text-gray-500 transition-all",
                isSaved && "text-yellow-400"
              )}
            >
              <Bookmark
                className={cn(
                  "h-4 w-4 group-hover:scale-110 transition-transform",
                  isSaved && "fill-current"
                )}
              />
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
