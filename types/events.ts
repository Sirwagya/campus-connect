export type EventParticipationType = 'solo' | 'team' | 'both';

/**
 * Event entity representing a campus event
 */
export interface Event {
    id: string;
    title: string;
    description: string | null;
    start_ts: string;
    end_ts: string | null;
    location: string | null;
    capacity: number | null;
    image_path: string | null;
    color_block: string | null;
    tags: string[] | null;
    category: string | null;
    created_by: string | null;
    approved: boolean | null;
    created_at: string | null;
    updated_at: string | null;
    participants_count: number | null;
    participation_type: string | null;
    min_team_size: number | null;
    max_team_size: number | null;
}

/**
 * Team entity for team-based events
 */
export interface Team {
    id: string;
    event_id: string;
    name: string;
    code: string;
    leader_id: string;
    created_at: string;
    updated_at: string;
    members?: TeamMember[];
}

/**
 * Team member entity
 */
export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    role: string | null;
    status: 'pending' | 'accepted' | 'rejected';
    invited_at: string;
    joined_at: string | null;
}

/**
 * Lightweight payload for client-side team creation
 */
export interface TeamMemberInput {
    userId?: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
}

export type EventRegistrationFormValue = string | number | boolean;

export type EventRegistrationFormData = Record<string, EventRegistrationFormValue>;

export interface EventRegistrationPayload {
    participationType: Exclude<EventParticipationType, 'both'>;
    teamAction?: 'create' | 'join';
    teamName?: string;
    teamCode?: string;
    members?: TeamMemberInput[];
    formData?: EventRegistrationFormData;
}

/**
 * Event registration entity
 */
export interface EventRegistration {
    id: string;
    event_id: string;
    user_id: string;
    registered_at: string;
    team_id: string | null;
    form_response_id: string | null;
}

/**
 * Event comment entity
 */
export interface EventComment {
    id: string;
    event_id: string;
    user_id: string;
    parent_id: string | null;
    body: string;
    created_at: string;
    user?: {
        id: string;
        name: string;
        avatar_url: string | null;
    };
    replies?: EventComment[];
}

/**
 * Event reaction entity
 */
export interface EventReaction {
    id: string;
    event_id: string;
    user_id: string;
    reaction: string;
    created_at: string;
}

/**
 * Event form schema
 */
export interface EventForm {
    id: string;
    event_id: string;
    schema: Record<string, unknown>;
    created_by: string;
    created_at: string;
}

/**
 * Event form response
 */
export interface EventFormResponse {
    id: string;
    form_id: string;
    user_id: string;
    response: Record<string, unknown>;
    submitted_at: string;
}

/**
 * Create event input type
 */
export interface CreateEventInput {
    title: string;
    description?: string;
    start_ts: string;
    end_ts?: string;
    location?: string;
    capacity?: number;
    image_path?: string;
    color_block?: string;
    tags?: string[];
    category?: string;
    participation_type?: EventParticipationType;
    min_team_size?: number;
    max_team_size?: number;
}
