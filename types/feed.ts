import type { Database } from "@/types/database";

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
export type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type FeedUser = Pick<
  UserRow,
  "id" | "name" | "full_name" | "avatar_url" | "email"
> & {
  role?: string | null;
};

export interface FeedAttachment {
  url: string;
  mime_type?: string | null;
  name?: string | null;
  size?: number | null;
  [key: string]: unknown;
}

export interface PostWithRelations extends PostRow {
  user?: FeedUser | null;
  likes?: Array<Pick<PostLikeRow, "user_id">>;
  comments?: Array<{ count?: number } | Pick<CommentRow, "id">> | null;
}

export interface FeedPost
  extends Pick<PostRow, "id" | "body" | "created_at" | "user_id"> {
  content: string; // Alias for body for backward compatibility
  user?: FeedUser | null;
  attachments?: FeedAttachment[];
  liked_by_user: boolean;
  likes_count: number;
  comments_count: number;
  shares_count?: number | null;
  isOptimistic?: boolean;
}

export interface FeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
}

export interface FeedComment
  extends Pick<CommentRow, "id" | "content" | "created_at" | "user_id"> {
  user?: FeedUser | null;
}

export interface CommentResponse {
  comments: FeedComment[];
}
