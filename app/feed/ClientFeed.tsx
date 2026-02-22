"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Composer } from "@/components/feed/Composer";
import { PostList } from "@/components/feed/PostList";
import { NewPostsBanner } from "@/components/feed/NewPostsBanner";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { ActiveMembersWidget } from "@/components/feed/ActiveMembersWidget";
import { AnnouncementsWidget } from "@/components/feed/AnnouncementsWidget";
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
              const normalized = normalizeFeedPost(
                fullPost as PostWithRelations,
                user.id
              );

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
    <div className="w-full max-w-7xl mx-auto min-h-screen pb-20">
      {/* New Posts Banner */}
      <NewPostsBanner onRefresh={refreshFeed} />

      <DashboardHero />

      {/* Grid Layout: Sidebar + Main Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 lg:px-6">
        {/* Left Sidebar - Hidden on mobile, shown on lg+ */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20 self-start">
          <ActiveMembersWidget maxItems={6} />
          <AnnouncementsWidget maxItems={3} />
        </aside>

        {/* Main Feed */}
        <main className="lg:col-span-9 w-full max-w-[720px] mx-auto lg:mx-0">
          <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 mb-6 -mx-4 lg:mx-0 lg:rounded-2xl">
            <h1 className="text-xl font-light tracking-tight text-white">
              {isRefreshing ? "Refreshing..." : "Latest Updates"}
            </h1>
          </div>

          <div className="space-y-6">
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
        </main>
      </div>

      {/* Mobile Widgets - Shown only on mobile as a collapsible section */}
      <div className="lg:hidden px-4 mt-8 space-y-4">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none bg-white/[0.03] rounded-2xl px-4 py-3 border border-white/5">
            <span className="text-sm font-medium text-white">
              Active Members & Announcements
            </span>
            <svg
              className="w-5 h-5 text-white/50 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="mt-4 space-y-4">
            <ActiveMembersWidget maxItems={5} />
            <AnnouncementsWidget maxItems={3} />
          </div>
        </details>
      </div>
    </div>
  );
}
