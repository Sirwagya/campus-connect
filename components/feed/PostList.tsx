"use client";

import { useEffect, useRef } from "react";
import { PostCard } from "./PostCard";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface PostListProps {
  posts: any[];
  currentUserId?: string;
  currentUser?: any; // Added
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
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
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
          You've reached the end!
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
