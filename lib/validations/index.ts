import { z } from 'zod';

// ================================================================
// Common Schemas
// ================================================================

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ================================================================
// User & Profile Schemas
// ================================================================

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  display_name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  tagline: z.string().max(150).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  visibility: z.enum(['public', 'private']).optional(),
  social_links: z.record(z.string(), z.string().url()).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ================================================================
// Follow Schemas
// ================================================================

export const followActionSchema = z.object({
  targetUserId: uuidSchema,
});

export type FollowActionInput = z.infer<typeof followActionSchema>;

// ================================================================
// Post Schemas
// ================================================================

export const createPostSchema = z.object({
  body: z.string().min(1).max(5000),
  visibility: z.enum(['public', 'space']).default('public'),
  space_id: uuidSchema.optional(),
  attachments: z.array(z.object({
    type: z.enum(['image', 'video', 'file']),
    url: z.string().url(),
    name: z.string().optional(),
  })).max(10).optional(),
});

export const updatePostSchema = z.object({
  body: z.string().min(1).max(5000).optional(),
  is_pinned: z.boolean().optional(),
  is_locked: z.boolean().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

// ================================================================
// Comment Schemas
// ================================================================

export const createCommentSchema = z.object({
  post_id: uuidSchema,
  content: z.string().min(1).max(2000),
  parent_id: uuidSchema.optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// ================================================================
// Reaction Schemas
// ================================================================

export const reactionSchema = z.object({
  target_type: z.enum(['post', 'comment']),
  target_id: uuidSchema,
  emoji: z.enum(['like', 'love', 'celebrate', 'support', 'insightful', 'funny']).default('like'),
});

export type ReactionInput = z.infer<typeof reactionSchema>;

// ================================================================
// Event Schemas
// ================================================================

export const createEventSchema = z.object({
  title: z.string().min(5).max(200),
  summary: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  venue: z.string().max(200).optional(),
  venue_maps_url: z.string().url().optional(),
  start_ts: z.string().datetime(),
  end_ts: z.string().datetime(),
  capacity: z.number().int().positive().optional(),
  registration_type: z.enum(['solo', 'team', 'both']).default('solo'),
  min_team_size: z.number().int().min(1).default(1),
  max_team_size: z.number().int().min(1).default(4),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  is_featured: z.boolean().default(false),
  banner_url: z.string().url().optional(),
  color_theme: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
}).refine(data => new Date(data.end_ts) > new Date(data.start_ts), {
  message: 'End time must be after start time',
  path: ['end_ts'],
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

// ================================================================
// Space Schemas
// ================================================================

export const createSpaceSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  is_private: z.boolean().default(false),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const updateSpaceSchema = createSpaceSchema.partial();

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;

// ================================================================
// Space Message Schemas
// ================================================================

export const sendMessageSchema = z.object({
  space_id: uuidSchema,
  channel_id: uuidSchema.optional(),
  content: z.string().min(1).max(4000),
  reply_to: uuidSchema.optional(),
  attachments: z.array(z.object({
    type: z.string(),
    url: z.string().url(),
    name: z.string().optional(),
  })).max(5).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ================================================================
// Presence Schemas
// ================================================================

export const updatePresenceSchema = z.object({
  status: z.enum(['online', 'away', 'busy', 'offline']),
  custom_status: z.string().max(100).optional(),
});

export type UpdatePresenceInput = z.infer<typeof updatePresenceSchema>;

// ================================================================
// Helper: Validate request body
// ================================================================

export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { data: null, error: messages };
    }
    return { data: null, error: 'Invalid request body' };
  }
}

// ================================================================
// Helper: Validate query params
// ================================================================

export function validateParams<T>(
  params: Record<string, string | string[] | undefined>,
  schema: z.ZodSchema<T>
): { data: T; error: null } | { data: null; error: string } {
  try {
    const data = schema.parse(params);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { data: null, error: messages };
    }
    return { data: null, error: 'Invalid parameters' };
  }
}
