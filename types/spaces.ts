export type SpaceRole = 'owner' | 'moderator' | 'member';

export interface Space {
    id: string;
    slug: string;
    name: string;
    description?: string;
    is_private: boolean;
    owner_id: string;
    tags: string[];
    member_count: number;
    created_at: string;
    updated_at: string;
}

export interface SpaceMember {
    id: string;
    space_id: string;
    user_id: string;
    role: SpaceRole;
    joined_at: string;
    user?: {
        id: string;
        name: string;
        full_name: string;
        avatar_url: string;
    };
}

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
        name: string;
        full_name: string;
        avatar_url: string;
    };
    reactions?: SpaceMessageReaction[];
}

export interface SpaceMessageReaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
}
