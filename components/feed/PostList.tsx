"use client";

import { useEffect, useRef } from "react";
import { PostCard } from "./PostCard";
import { Loader2 } from "lucide-react";
import type { FeedPost, FeedUser } from "@/types/feed";

interface PostListProps {
  posts: FeedPost[];
  currentUserId?: string;
  currentUser?: FeedUser;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function PostList({
  posts,
  currentUserId,
  currentUser,
  onLoadMore,
  hasMore,
  loading,
}: PostListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className="divide-y">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          currentUser={currentUser}
        />
      ))}

      {loading && (
        <div className="p-4 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && hasMore && <div ref={observerTarget} className="h-10" />}

      {!loading && !hasMore && posts.length > 0 && (
        <div className="p-8 text-center text-muted-foreground text-sm">
          You&apos;ve reached the end!
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No posts yet. Be the first to post!
        </div>
      )}
    </div>
  );
}
