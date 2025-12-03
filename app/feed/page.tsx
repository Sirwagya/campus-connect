import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeFeedPost } from "@/lib/feed/normalize";
import type { FeedPost, FeedUser, PostWithRelations } from "@/types/feed";
import ClientFeed from "./ClientFeed";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/api/auth/google");
  }

  // Fetch current user's profile
  const { data: userProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  // Fetch initial posts on server
  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      user:users!posts_user_id_fkey(id, name, full_name, avatar_url, email),
      likes:post_reactions(user_id), 
      comments:comments(count)
    `
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (error && (error.message || error.code)) {
    console.error(
      "Error fetching initial feed:",
      error.message,
      error.code,
      error.details
    );
  }

  // Process posts for initial state (similar to API)
  const enrichedPosts: FeedPost[] = (posts || []).map((post) =>
    normalizeFeedPost(post as PostWithRelations, session.user.id)
  );

  const nextCursor =
    enrichedPosts.length === 10
      ? enrichedPosts[enrichedPosts.length - 1].created_at
      : null;

  // Combine auth session email with profile data if profile email is missing
  const effectiveUser: FeedUser = {
    id: session.user.id,
    email: userProfile?.email || session.user.email || "",
    name:
      userProfile?.name ||
      userProfile?.full_name ||
      session.user.user_metadata?.full_name ||
      session.user.email?.split("@")[0] ||
      "User",
    full_name:
      userProfile?.full_name ||
      userProfile?.name ||
      session.user.user_metadata?.full_name,
    avatar_url:
      userProfile?.avatar_url || session.user.user_metadata?.avatar_url,
    role: (userProfile as { role?: string | null } | null)?.role ?? null,
  };

  return (
    <main className="flex min-h-screen justify-center">
      <ClientFeed
        initialPosts={enrichedPosts}
        initialCursor={nextCursor}
        user={effectiveUser}
      />
    </main>
  );
}
