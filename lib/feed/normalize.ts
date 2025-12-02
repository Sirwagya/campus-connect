import type { FeedAttachment, FeedPost, PostWithRelations } from "@/types/feed";

const coerceAttachments = (value: unknown): FeedAttachment[] | undefined => {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value as FeedAttachment[];
  }

  return undefined;
};

const resolveCommentsCount = (
  comments: PostWithRelations["comments"]
): number => {
  if (!comments) {
    return 0;
  }

  // When selecting comments(count), Supabase returns [{ count: number }]
  if (comments.length === 1 && "count" in comments[0]) {
    return comments[0].count ?? 0;
  }

  return comments.length;
};

/**
 * Normalize a raw PostWithRelations (Supabase row) into the shape expected by feed UI.
 */
export const normalizeFeedPost = (
  post: PostWithRelations,
  currentUserId?: string | null
): FeedPost => {
  const likes = post.likes ?? [];

  const postContent = post.body ?? (post as unknown as { content?: string }).content ?? "";
  
  return {
    id: post.id,
    body: postContent,
    content: postContent,
    created_at: post.created_at ?? new Date().toISOString(),
    user_id: post.user_id,
    user: post.user,
    attachments: coerceAttachments(post.attachments ?? undefined),
    liked_by_user: currentUserId
      ? likes.some((like) => like.user_id === currentUserId)
      : false,
    likes_count: typeof (post as { likes_count?: number }).likes_count === "number"
      ? (post as { likes_count?: number }).likes_count ?? likes.length
      : likes.length,
    comments_count: resolveCommentsCount(post.comments),
    shares_count: (post as { shares_count?: number | null }).shares_count ?? null,
  };
};