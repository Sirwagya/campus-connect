export type AlertFilter =
  | "all"
  | "starred"
  | "notifications"
  | "sent"
  | "drafts"
  | "spam";

export interface Alert {
  id: number;
  gmail_id: string;
  from_email: string;
  subject: string;
  snippet: string;
  received_at: string;
  starred: boolean;
  unread: boolean;
}

export type NotificationPayload = {
  space_slug?: string;
};

export interface Notification {
  id: string;
  type: "space_invite" | "system";
  title: string;
  message: string;
  data: NotificationPayload;
  is_read: boolean;
  created_at: string;
}
