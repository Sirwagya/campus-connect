export type MailCategory = 'inbox' | 'sent' | 'draft' | 'spam' | 'trash';

export interface Mail {
    id: string;
    user_id: string;
    gmail_id: string | null;
    thread_id: string | null;
    subject: string | null;
    body: string | null;
    from: string | null;
    to: string | null;
    timestamp: string;
    is_read: boolean;
    is_starred: boolean;
    category: MailCategory;
    labels: string[];
    created_at: string;
    updated_at: string;
}

export interface SendMailParams {
    to: string;
    subject: string;
    body: string; // HTML or Text
    cc?: string;
    bcc?: string;
}

export interface DraftMailParams extends SendMailParams {
    id?: string; // If updating an existing draft
}
