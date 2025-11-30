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
    tags: string[];
    category: string | null;
    created_by: string;
    approved: boolean;
    created_at: string;
    updated_at: string;
    participants_count: number;
    participation_type: 'solo' | 'team' | 'both';
    min_team_size: number;
    max_team_size: number;
}

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

export interface EventRegistration {
    id: string;
    event_id: string;
    user_id: string;
    registered_at: string;
    team_id: string | null;
    form_response_id: string | null;
}

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
        avatar_url: string;
    };
    replies?: EventComment[];
}

export interface EventReaction {
    id: string;
    event_id: string;
    user_id: string;
    reaction: string;
    created_at: string;
}

export interface EventForm {
    id: string;
    event_id: string;
    schema: any; // JSON schema
    created_by: string;
    created_at: string;
}

export interface EventFormResponse {
    id: string;
    form_id: string;
    user_id: string;
    response: any;
    submitted_at: string;
}
