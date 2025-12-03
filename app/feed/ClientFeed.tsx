"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Composer } from "@/components/feed/Composer";
import { PostList } from "@/components/feed/PostList";
import { NewPostsBanner } from "@/components/feed/NewPostsBanner";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { createClient } from "@/lib/supabase/client";
import { normalizeFeedPost } from "@/lib/feed/normalize";
import type {
  PostWithRelations,
  FeedResponse,
  FeedUser,
  FeedPost,
} from "@/types/feed";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface ClientFeedProps {
  initialPosts: FeedPost[];
  initialCursor: string | null;
  user: FeedUser;
}

export default function ClientFeed({
  initialPosts,
  initialCursor,
  user,
}: ClientFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialCursor);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // Refresh feed (fetch latest posts)
  const refreshFeed = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/feed?limit=10");
      const data = (await res.json()) as FeedResponse;

      if (data.posts) {
        setPosts(data.posts);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      }
    } catch (error) {
      console.error("Failed to refresh feed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (loading || !cursor || !hasMore) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/feed?cursor=${cursor}&limit=10`);
      const data = (await res.json()) as FeedResponse;

      if (data.posts) {
        setPosts((prev) => [...prev, ...data.posts]);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("public:posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload: RealtimePostgresChangesPayload<PostWithRelations>) => {
          const newRecord = payload.new as
            | PostWithRelations
            | Record<string, never>;
          if (!("id" in newRecord) || !newRecord.id) return;
          const newPostId = newRecord.id;

          // Check if we already have this post (e.g. from optimistic update)
          // Optimistic posts have 'temp-' IDs, so we might have a duplicate if we don't handle it.
          // Ideally, we'd replace the temp post with the real one.
          // For now, let's just fetch the full post details (to get user info) and prepend it.

          // Fetch the full post with user details
          const { data: fullPost } = await supabase
            .from("posts")
            .select(
              `
              *,
              user:users(id, name, full_name, avatar_url, email),
              likes:post_likes(user_id), 
              comments:comments(count)
            `
            )
            .eq("id", newPostId)
            .single();

          if (fullPost) {
            setPosts((prev) => {
              // Filter out optimistic post if it matches (hard to know without correlation ID,
              // but we can filter by content/user if needed, or just prepend and let React key handle it if we replace)
              // Simple approach: Prepend real post.
              const normalized = normalizeFeedPost(
                fullPost as PostWithRelations,
                user.id
              );

              // Remove optimistic version if the ID differs but content/user match
              const filtered = prev.filter(
                (existing) =>
                  !existing.isOptimistic ||
                  existing.content !== normalized.content ||
                  existing.user_id !== normalized.user_id
              );

              return [normalized, ...filtered];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user.id]);

  const handlePostCreated = (newPost: FeedPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="w-full max-w-[720px] mx-auto min-h-screen pb-20">
      {/* New Posts Banner */}
      <NewPostsBanner onRefresh={refreshFeed} />

      <DashboardHero />

      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 mb-6">
        <h1 className="text-xl font-light tracking-tight text-white">
          {isRefreshing ? "Refreshing..." : "Latest Updates"}
        </h1>
      </div>

      <div className="px-4 md:px-0 space-y-6">
        <Composer user={user} onPostCreated={handlePostCreated} />

        <PostList
          posts={posts}
          currentUserId={user.id}
          currentUser={user}
          onLoadMore={loadMore}
          hasMore={hasMore}
          loading={loading}
        />
      </div>
    </div>
  );
}
