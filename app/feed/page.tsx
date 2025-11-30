import { createServerSupabase } from "@/lib/supabase-server";
import ClientFeed from "./ClientFeed";
import { redirect } from "next/navigation";

export default async function FeedPage() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
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
      user:users(id, name, full_name, avatar_url, email),
      likes:post_likes(user_id), 
      comments:comments(count)
    `
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching initial feed:", error);
  }

  // Process posts for initial state (similar to API)
  const enrichedPosts = (posts || []).map((post: any) => ({
    ...post,
    liked_by_user: post.likes.some(
      (like: any) => like.user_id === session.user.id
    ),
    likes: undefined,
    likes_count: post.likes_count || 0,
    comments_count: post.comments?.[0]?.count || 0,
    comments: undefined,
  }));

  const nextCursor =
    enrichedPosts.length === 10
      ? enrichedPosts[enrichedPosts.length - 1].created_at
      : null;

  // Combine auth session email with profile data if profile email is missing
  const effectiveUser = {
    ...userProfile,
    email: userProfile?.email || session.user.email,
    id: session.user.id, // Ensure ID is present
    name:
      userProfile?.name ||
      userProfile?.full_name ||
      session.user.user_metadata?.full_name ||
      session.user.email?.split("@")[0],
    avatar_url:
      userProfile?.avatar_url || session.user.user_metadata?.avatar_url,
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
