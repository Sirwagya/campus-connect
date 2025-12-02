/**
 * Space role types
 */
export type SpaceRole = 'owner' | 'moderator' | 'member';

/**
 * Space entity representing a collaboration space/group
 */
export interface Space {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    is_private: boolean | null;
    owner_id: string | null;
    tags: string[] | null;
    member_count: number | null;
    icon_url?: string | null;
    banner_url?: string | null;
    created_at: string;
    updated_at: string | null;
}

/**
 * Space member entity
 */
export interface SpaceMember {
    id: string;
    space_id: string;
    user_id: string;
    role: SpaceRole;
    joined_at: string;
    user?: {
        id: string;
        name: string | null;
        full_name: string | null;
        avatar_url: string | null;
    };
}

/**
 * Space message entity for real-time chat
 */
export interface SpaceMessage {
    id: string;
    space_id: string;
    author_id: string;
    content: string;
    mime: string;
    reply_to?: string;
    is_edited: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    author?: {
        id: string;
        name: string | null;
        full_name: string | null;
        avatar_url: string | null;
    };
    reactions?: SpaceMessageReaction[];
}

/**
 * Space message reaction entity
 */
export interface SpaceMessageReaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
}

/**
 * Space invite entity
 */
export interface SpaceInvite {
    id: string;
    space_id: string;
    code: string;
    created_by: string;
    expires_at: string | null;
    max_uses: number | null;
    use_count: number;
    created_at: string;
}

/**
 * Create space input type
 */
export interface CreateSpaceInput {
    name: string;
    slug: string;
    description?: string;
    is_private?: boolean;
    tags?: string[];
}
